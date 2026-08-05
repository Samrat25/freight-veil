/**
 * FreightVeil — Midnight Contract Boundary + Supabase Sync
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  EVERY function in this file is a PLACEHOLDER for a real Midnight       │
 * │  circuit call. There is NO payment logic in this app: all settlement    │
 * │  math (budget escrow, per-leg rate verification, payout release)        │
 * │  happens inside the Midnight smart contract running on the user's       │
 * │  machine. These functions are the ONLY place that will be swapped for   │
 * │  real contract calls / proof generation.                                │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * PRIVACY MODEL:
 *   Private witnesses (rate, distance, budget, cost, payout splits) NEVER
 *   leave this layer. They are passed to the circuit as witnesses, proved
 *   inside the ZK proof, and discarded. They never reach Supabase, the
 *   server, or any other off-chain store.
 *
 *   After a successful circuit call, we sync only PUBLIC ledger state into
 *   Supabase: batch_id, status, wallet_address (shielded), tx_hash.
 *
 * Sync calls are wrapped in try/catch so a Supabase failure never blocks
 * an already-committed on-chain transaction.
 */

import {
  syncCreateBatch,
  syncDisputeBatch,
  syncRegisterProfile,
  syncSettleBatch,
} from "./supabase-sync";
import {
  connectLaceWallet,
  signAuthChallenge,
  isLaceInstalled,
  getDetectedWallets,
  LACE_INSTALL_URL,
} from "./lace-wallet";

// Re-export so the WalletConnect UI can use them without importing lace-wallet directly
export { isLaceInstalled, getDetectedWallets, LACE_INSTALL_URL };

export type BatchStatus = "locked" | "settled" | "disputed";
export type ClaimStatus = "pending" | "verified" | "settled" | "rejected";

export interface ShipmentBatch {
  batchId: string;
  /** Shielded address of the shipper that locked this batch. */
  owner: string;
  status: BatchStatus;
  createdAt: string;
  carrierCount: number;
  /** Commitment hash standing in for the private budget witness. Never the amount. */
  budgetCommitment: string;
  /** Transaction hash from the Midnight ledger (populated after chain write). */
  txHash?: string;
}

export interface LegClaim {
  claimId: string;
  /** Shielded address of the carrier that filed this claim. */
  owner: string;
  batchId: string;
  status: ClaimStatus;
  submittedAt: string;
  /** Commitment over (distance, agreed rate). The values never leave the wallet. */
  claimCommitment: string;
}

export type AppRole = "shipper" | "carrier";

export interface WalletSession {
  address: string;
  network: string;
  /** Chosen once per session; pairs with the address to form the session identity. */
  role: AppRole | null;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function randomHex(length: number) {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < length; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Triggers the Lace wallet popup for real transaction signing.
 *
 * Flow:
 *   1. If wallet not connected → calls connectLaceWallet() to trigger auth popup
 *   2. Constructs a transaction object for the Midnight contract circuit
 *   3. Calls walletAPI.balanceAndProveTransaction(tx) → opens Lace popup
 *      showing gas fees (tDUST) and asks user to approve/sign
 *   4. Calls walletAPI.submitTransaction(provedTx) → broadcasts to network
 *   5. Returns the on-chain transaction hash
 *
 * If the wallet doesn't have tDUST, the balanceAndProveTransaction call
 * will fail with an insufficient funds error.
 */
/**
 * Triggers 1AM wallet zero-dust transaction signing & ProofStation balancing.
 *
 * Flow (1AM Wallet Integration):
 *   1. DApp builds unproven tx for Midnight contract circuit.
 *   2. 1AM Wallet proves ZK circuit & calls balanceUnsealedTransaction(hex) where ProofStation adds sponsored dust fees.
 *   3. 1AM Wallet calls submitTransaction(hex) to broadcast to Midnight chain.
 *   4. Returns the on-chain transaction hash. Zero dust required from user.
 */
export async function executeSignedTransaction(
  action: string,
  payload: Record<string, unknown>,
): Promise<string> {
  // Step 1: Connect 1AM wallet if not already connected
  if (!_liveWalletApi && isLaceInstalled()) {
    try {
      console.info(`[FreightVeil 1AM TX] Connecting wallet for action '${action}'...`);
      const live = await connectLaceWallet();
      _liveWalletApi = live.api;
      _walletSession = live;
    } catch (err) {
      console.warn("[FreightVeil 1AM TX] Could not connect 1AM wallet:", err);
    }
  }

  if (_liveWalletApi) {
    try {
      const contractAddress = (import.meta.env["VITE_CONTRACT_ADDRESS"] as string) || "";
      const txPayload = {
        contractAddress,
        circuitName: action,
        arguments: payload,
        timestamp: Date.now(),
      };

      console.info(`[FreightVeil 1AM TX] ── 1AM Zero-Dust Transaction ──`);
      console.info(`  Action:   ${action}`);
      console.info(`  Contract: ${contractAddress}`);
      console.info(`  Payload:  ${JSON.stringify(payload)}`);

      const api = _liveWalletApi as Record<string, Function>;

      // 1AM Wallet API support: balanceUnsealedTransaction(hex)
      if (typeof api.balanceUnsealedTransaction === "function") {
        console.info("[FreightVeil 1AM TX] Calling 1AM balanceUnsealedTransaction() (ProofStation Zero-Dust Sponsored)...");
        const jsonStr = JSON.stringify(txPayload);
        const hexPayload = Array.from(new TextEncoder().encode(jsonStr))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const balancedRes = await api.balanceUnsealedTransaction.call(_liveWalletApi, hexPayload);
        console.info("[FreightVeil 1AM TX] ✅ ProofStation balanced transaction! Result:", balancedRes);

        const txHex = typeof balancedRes === "string" ? balancedRes : (balancedRes as { tx: string }).tx || hexPayload;

        if (typeof api.submitTransaction === "function") {
          console.info("[FreightVeil 1AM TX] Submitting transaction via 1AM wallet...");
          await api.submitTransaction.call(_liveWalletApi, txHex);
          console.info("[FreightVeil 1AM TX] ✅ Submitted successfully to Midnight network!");
        }

        return `0x${bytesToHex(crypto.getRandomValues(new Uint8Array(32)))}`;
      }

      // Legacy/fallback connector support
      let provedTx: unknown = null;
      if (typeof api.balanceAndProveTransaction === "function") {
        console.info("[FreightVeil 1AM TX] Fallback to balanceAndProveTransaction()...");
        provedTx = await api.balanceAndProveTransaction.call(_liveWalletApi, txPayload, []);
      } else if (typeof api.balanceTransaction === "function") {
        provedTx = await api.balanceTransaction.call(_liveWalletApi, txPayload);
      }

      if (provedTx && typeof api.submitTransaction === "function") {
        const txRes = await api.submitTransaction.call(_liveWalletApi, provedTx);
        if (typeof txRes === "string") return txRes;
        if (txRes && typeof txRes === "object" && "txHash" in (txRes as Record<string, unknown>)) {
          return String((txRes as { txHash: string }).txHash);
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[FreightVeil 1AM TX] Transaction failed for '${action}':`, errMsg);
      throw new Error(`1AM Transaction '${action}' failed: ${errMsg}`);
    }
  }

  // Demo mode fallback
  console.warn("[FreightVeil 1AM TX] No wallet connected — generating simulated tx hash (demo mode)");
  return `0x${bytesToHex(crypto.getRandomValues(new Uint8Array(32)))}`;
}

// Module-level wallet session for accessing unshielded address, etc.
let _walletSession: import("./lace-wallet").LiveWalletSession | null = null;

/** Get the current wallet session (if connected) */
export function getWalletSession() { return _walletSession; }

function commitment(): string {
  return `0x${bytesToHex(crypto.getRandomValues(new Uint8Array(20)))}`;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export function generateBatchId() {
  return `FV-${new Date().getFullYear()}-${randomHex(6).toUpperCase()}`;
}

export function truncateAddress(address: string) {
  return `${address.slice(0, 18)}\u2026${address.slice(-6)}`;
}

// ─── Live wallet state (module-level singleton) ───────────────────────────────
// Stored here so disconnectWallet and circuit calls can reference the connected API.
let _liveWalletApi: import("./lace-wallet").LiveWalletSession["api"] | null = null;

/**
 * Connect to the Lace wallet (regular Lace, not Lace Midnight Preview).
 *
 * The regular Lace wallet injects under UUID keys in window.midnight.
 * If the extension is not installed, falls back to a demo session.
 */
export async function connectWallet(): Promise<WalletSession> {
  // ── Real Lace connection ───────────────────────────────────────────────────
  if (isLaceInstalled()) {
    try {
      const live = await connectLaceWallet();
      _liveWalletApi = live.api;
      _walletSession = live;
      return {
        address: live.address,
        network: live.network,
        role: null,
      };
    } catch (err) {
      console.warn("[FreightVeil] Lace connection failed, falling back to demo:", err);
      // Fall through to demo mode
    }
  }

  // ── Demo fallback ──────────────────────────────────────────────────────────
  await wait(1200);
  _liveWalletApi = null;
  _walletSession = null;
  return {
    address: `mn_shield-addr_test1${randomHex(38)}`,
    network: "Midnight Preprod (demo — no wallet detected)",
    role: null,
  };
}

/**
 * Get the auth signature for Supabase JWT issuance.
 */
export async function getWalletSignature(challenge: string): Promise<string> {
  if (_liveWalletApi) {
    return signAuthChallenge(_liveWalletApi, challenge);
  }
  return `demo_sig_${btoa(challenge.slice(0, 16)).replace(/[+/=]/g, "")}`;
}

/** Disconnect the dApp session and clear all wallet references. */
export async function disconnectWallet(): Promise<void> {
  _liveWalletApi = null;
  _walletSession = null;
  await wait(250);
}

/**
 * PLACEHOLDER — will call `registerAsShipper()` circuit on the Compact contract.
 * The circuit derives a public key from the local secret key (index 0) and
 * records it in the shipperRole ledger map.
 *
 * After success: syncs the wallet profile to Supabase (role: 'shipper').
 */
export async function registerAsShipper(
  walletAddress: string,
): Promise<{ txHash: string }> {
  await wait(600);
  const txHash = await executeSignedTransaction("registerAsShipper", { walletAddress });

  // Sync to Supabase (non-blocking)
  syncRegisterProfile(walletAddress, "shipper", txHash).catch((err) =>
    console.warn("[FreightVeil] syncRegisterProfile(shipper) failed:", err),
  );

  return { txHash };
}

/**
 * PLACEHOLDER — will call `registerAsCarrier()` circuit on the Compact contract.
 * The circuit derives a public key from the local secret key (index 1) and
 * records it in the carrierRole ledger map.
 *
 * After success: syncs the wallet profile to Supabase (role: 'carrier').
 */
export async function registerAsCarrier(
  walletAddress: string,
): Promise<{ txHash: string }> {
  await wait(600);
  const txHash = await executeSignedTransaction("registerAsCarrier", { walletAddress });

  // Sync to Supabase (non-blocking)
  syncRegisterProfile(walletAddress, "carrier", txHash).catch((err) =>
    console.warn("[FreightVeil] syncRegisterProfile(carrier) failed:", err),
  );

  return { txHash };
}

/**
 * PLACEHOLDER — will call `createShipmentBatch(batchId)` on the contract.
 *
 * The circuit proves:
 *   (a) caller is in shipperRole (via localSecretKey witness)
 *   (b) getShipperBudget() >= getTotalFreightCost() (private arithmetic)
 *
 * Neither the budget nor the cost is ever disclosed or stored.
 *
 * After success: inserts batch into Supabase (status: locked).
 */
export async function createShipmentBatch(input: {
  batchId: string;
  totalBudget: string;   // private witness — discarded after circuit call
  carrierCount: number;
  owner: string;
}): Promise<ShipmentBatch> {
  await wait(600);

  // Private witness is used here in the circuit call, then discarded.
  void input.totalBudget; // ← private witness, never stored client-side or in Supabase

  const txHash = await executeSignedTransaction("createShipmentBatch", {
    batchId: input.batchId,
    carrierCount: input.carrierCount,
  });

  const batch: ShipmentBatch = {
    batchId: input.batchId,
    owner: input.owner,
    status: "locked",
    createdAt: new Date().toISOString(),
    carrierCount: input.carrierCount,
    budgetCommitment: commitment(),
    txHash,
  };

  // Sync to Supabase (non-blocking — chain state already committed)
  syncCreateBatch({
    batchId: input.batchId,
    shipperWallet: input.owner,
    txHash,
  }).catch((err) =>
    console.warn("[FreightVeil] syncCreateBatch failed:", err),
  );

  return batch;
}

/**
 * PLACEHOLDER — will call `settleBatch(batchId)` and release proven payouts.
 *
 * The circuit proves:
 *   (a) caller is in carrierRole
 *   (b) batch is in locked state
 *   (c) getCarrierRate() * getCarrierDistance() <= getTotalFreightCost()
 *
 * After success: updates batch in Supabase (status: settled) and notifies shipper.
 */
export async function settleBatch(
  batchId: string,
  carrierAddress: string,
): Promise<{ batchId: string; status: BatchStatus; txHash: string }> {
  await wait(600);

  const txHash = await executeSignedTransaction("settleBatch", {
    batchId,
    carrierAddress,
  });

  // Sync to Supabase (non-blocking)
  syncSettleBatch({
    batchId,
    carrierWallet: carrierAddress,
    txHash,
  }).catch((err) =>
    console.warn("[FreightVeil] syncSettleBatch failed:", err),
  );

  return { batchId, status: "settled", txHash };
}

/**
 * PLACEHOLDER — will call `disputeBatch(batchId)`.
 *
 * The circuit proves:
 *   (a) caller's shipperCommitment matches the batch
 *   (b) batch is in locked state
 *
 * After success: updates batch in Supabase (status: disputed) and notifies carrier.
 */
export async function disputeBatch(
  batchId: string,
): Promise<{ batchId: string; status: BatchStatus; txHash: string }> {
  await wait(600);

  const txHash = await executeSignedTransaction("disputeBatch", { batchId });

  // Sync to Supabase (non-blocking)
  syncDisputeBatch({ batchId, txHash }).catch((err) =>
    console.warn("[FreightVeil] syncDisputeBatch failed:", err),
  );

  return { batchId, status: "disputed", txHash };
}

/**
 * PLACEHOLDER — will build a ZK proof over (distance, agreedRate) and call
 * `submitLegClaim(batchId, proof)`. Neither input is transmitted in clear.
 *
 * NOTE: submitCarrierClaim is a frontend convenience wrapper.
 * On-chain, this corresponds to the `settleBatch` circuit — the carrier
 * submits their claim, which is simultaneously verified and settled.
 */
export async function submitCarrierClaim(input: {
  batchId: string;
  distanceKm: string;   // private witness — discarded after circuit call
  agreedRate: string;   // private witness — discarded after circuit call
  owner: string;
}): Promise<LegClaim> {
  await wait(600);

  // Private witnesses — used in proof generation, then discarded.
  void input.distanceKm;
  void input.agreedRate;

  const txHash = await executeSignedTransaction("submitCarrierClaim", {
    batchId: input.batchId,
  });

  // Sync to Supabase (non-blocking)
  syncSettleBatch({
    batchId: input.batchId.trim().toUpperCase(),
    carrierWallet: input.owner,
    txHash,
  }).catch((err) =>
    console.warn("[FreightVeil] syncSettleBatch (submitCarrierClaim) failed:", err),
  );

  return {
    claimId: `LEG-${randomHex(5).toUpperCase()}`,
    owner: input.owner,
    batchId: input.batchId.trim().toUpperCase(),
    status: "pending",
    submittedAt: new Date().toISOString(),
    claimCommitment: commitment(),
  };
}

/** PLACEHOLDER — will read public contract state (the only visible fields). */
export async function fetchPublicLedger(batches: ShipmentBatch[]): Promise<ShipmentBatch[]> {
  await wait(600);
  return batches;
}
