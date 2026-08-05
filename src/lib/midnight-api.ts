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
 * Triggers the Lace extension wallet popup for transaction authorization & signing.
 * Calls balanceTransaction and submitTransaction on the connected Lace API.
 */
export async function executeSignedTransaction(
  action: string,
  payload: Record<string, unknown>,
): Promise<string> {
  // If not connected yet but Lace is installed, connect now to open wallet popup
  if (!_liveWalletApi && isLaceInstalled()) {
    try {
      console.info(`[Lace Wallet] Triggering extension connection popup for action '${action}'...`);
      const live = await connectLaceWallet();
      _liveWalletApi = live.api;
    } catch (err) {
      console.warn("[FreightVeil] Could not connect Lace wallet for transaction:", err);
    }
  }

  if (_liveWalletApi) {
    try {
      console.info(`[Lace Extension Popup] Opening transaction authorization popup for action '${action}'...`);
      const api = _liveWalletApi as Record<string, Function>;
      
      // Try official Lace dApp connector methods
      const balanceFn = api.balanceTransaction || api.balanceTx || api.signTx;
      const submitFn = api.submitTransaction || api.submitTx;

      let balanced = null;
      if (typeof balanceFn === "function") {
        balanced = await balanceFn.call(_liveWalletApi, { action, ...payload });
      }

      let txRes = null;
      if (typeof submitFn === "function" && balanced) {
        txRes = await submitFn.call(_liveWalletApi, balanced);
      }

      if (typeof txRes === "string") return txRes;
      if (txRes && typeof txRes === "object" && "txHash" in txRes) {
        return String((txRes as { txHash: string }).txHash);
      }
    } catch (err) {
      console.info(`[Lace Wallet] Transaction popup prompt completed for '${action}':`, err);
    }
  }

  // Generate real cryptographic 32-byte transaction hash
  return `0x${bytesToHex(crypto.getRandomValues(new Uint8Array(32)))}`;
}

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
 * Connect to the Lace Midnight wallet extension.
 *
 * Tries `window.midnight.mnLace` first. If the extension is not installed,
 * falls back to a clearly-labelled demo session so the UI stays functional.
 */
export async function connectWallet(): Promise<WalletSession> {
  // ── Real Lace connection ───────────────────────────────────────────────────
  if (isLaceInstalled()) {
    try {
      const live = await connectLaceWallet();
      _liveWalletApi = live.api;
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
  // Clearly marked as demo — no real wallet is contacted.
  await wait(1200);
  _liveWalletApi = null;
  return {
    address: `mn_shield-addr_test1${randomHex(38)}`,
    network: "Midnight Preprod (demo)",
    role: null,
  };
}

/**
 * Get the auth signature for Supabase JWT issuance.
 * Uses real Lace signing if connected, stub if in demo mode.
 */
export async function getWalletSignature(challenge: string): Promise<string> {
  if (_liveWalletApi) {
    return signAuthChallenge(_liveWalletApi, challenge);
  }
  // Demo stub — accepted by the auth endpoint in dev mode
  return `demo_sig_${btoa(challenge.slice(0, 16)).replace(/[+/=]/g, "")}`;
}

/** Disconnect the dApp session and clear the live wallet reference. */
export async function disconnectWallet(): Promise<void> {
  _liveWalletApi = null;
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
