/**
 * FreightVeil — Midnight contract boundary.
 *
 * EVERY function in this file is a PLACEHOLDER. There is no payment logic in
 * this app: all settlement math (budget escrow, per-leg rate verification,
 * payout release) happens inside the Midnight smart contract. These functions
 * are the only place that will be swapped for real contract calls / proof
 * generation later. Nothing else in the UI should ever touch chain state.
 */

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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function randomHex(length: number) {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < length; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** Placeholder for a Pedersen-style commitment. */
function commitment() {
  return `0x${randomHex(40)}`;
}

export function generateBatchId() {
  return `FV-${new Date().getFullYear()}-${randomHex(6).toUpperCase()}`;
}

export function truncateAddress(address: string) {
  return `${address.slice(0, 18)}\u2026${address.slice(-6)}`;
}

/** PLACEHOLDER — will request a session from the Lace / Midnight wallet extension. */
export async function connectWallet(): Promise<WalletSession> {
  await wait(1200);
  return {
    address: `mn_shield-addr_test1${randomHex(38)}`,
    network: "Midnight Testnet-02",
    role: null,
  };
}

/** PLACEHOLDER — will disconnect the dApp session. */
export async function disconnectWallet(): Promise<void> {
  await wait(250);
}

/**
 * PLACEHOLDER — will call `lockBatch(budgetWitness, legCount)` on the contract.
 * The budget is a private witness: proved sufficient, never published.
 */
export async function createShipmentBatch(input: {
  batchId: string;
  totalBudget: string;
  carrierCount: number;
  owner: string;
}): Promise<ShipmentBatch> {
  await wait(1600);
  void input.totalBudget; // discarded on purpose — private witness, never stored client-side
  return {
    batchId: input.batchId,
    owner: input.owner,
    status: "locked",
    createdAt: new Date().toISOString(),
    carrierCount: input.carrierCount,
    budgetCommitment: commitment(),
  };
}

/** PLACEHOLDER — will call `settleBatch(batchId)` and release proven payouts. */
export async function settleBatch(
  batchId: string,
): Promise<{ batchId: string; status: BatchStatus }> {
  await wait(1800);
  return { batchId, status: "settled" };
}

/** PLACEHOLDER — will call `flagDispute(batchId)`. */
export async function disputeBatch(
  batchId: string,
): Promise<{ batchId: string; status: BatchStatus }> {
  await wait(1200);
  return { batchId, status: "disputed" };
}

/**
 * PLACEHOLDER — will build a ZK proof over (distance, agreedRate) and call
 * `submitLegClaim(batchId, proof)`. Neither input is transmitted in clear.
 */
export async function submitCarrierClaim(input: {
  batchId: string;
  distanceKm: string;
  agreedRate: string;
  owner: string;
}): Promise<LegClaim> {
  await wait(1700);
  void input.distanceKm;
  void input.agreedRate;
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
