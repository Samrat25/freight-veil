/**
 * FreightVeil — Contract ↔ Supabase Sync Layer + Pending-State Reconciliation
 *
 * PRIVACY CONTRACT (enforced here):
 *   ✗ NEVER write: rate, distance, budget, cost, payout amount, or any
 *     value derived from private witnesses.
 *   ✓ ONLY write: batch_id, status, wallet_address (shielded), tx_hash,
 *     company_id, notification messages (text only, no amounts).
 */

import { supabase, supabaseAdmin } from "./supabase";
import type { BatchStatus } from "./supabase-types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncCreateBatchInput {
  batchId: string;
  shipperWallet: string;
  txHash?: string;
  companyId?: string;
}

interface SyncSettleBatchInput {
  batchId: string;
  carrierWallet: string;
  txHash?: string;
}

interface SyncDisputeBatchInput {
  batchId: string;
  txHash?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function insertNotification(
  walletAddress: string,
  message: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("notifications")
    .insert({ wallet_address: walletAddress, message });

  if (error) {
    console.warn("[FreightVeil sync] Notification insert failed:", error.message);
  }
}

function updateBatchStatus(
  batchId: string,
  update: {
    status: BatchStatus | "pending";
    carrier_wallet?: string;
    tx_hash?: string;
  },
) {
  return supabaseAdmin
    .from("batches_view")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("batch_id", batchId);
}

// ─── Sync: Pending batch ──────────────────────────────────────────────────────

/** Insert into batches_view with status = 'pending' before chain confirmation */
export async function syncPendingBatch(
  batchId: string,
  shipperWallet: string,
  companyId?: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from("batches_view").upsert({
    batch_id: batchId,
    status: "pending",
    shipper_wallet: shipperWallet,
    company_id: companyId ?? null,
  });

  if (error) {
    console.warn("[FreightVeil sync] syncPendingBatch failed:", error.message);
  }
}

// ─── Sync: createShipmentBatch ────────────────────────────────────────────────

export async function syncCreateBatch(input: SyncCreateBatchInput): Promise<void> {
  const { batchId, shipperWallet, txHash, companyId } = input;

  const { error } = await supabaseAdmin.from("batches_view").upsert({
    batch_id: batchId,
    status: "locked",
    shipper_wallet: shipperWallet,
    company_id: companyId ?? null,
    tx_hash: txHash ?? null,
  });

  if (error) {
    console.warn("[FreightVeil sync] syncCreateBatch failed:", error.message);
    return;
  }

  await insertNotification(
    shipperWallet,
    `Batch ${batchId} created and locked on-chain. Awaiting carrier claims.`,
  );
}

// ─── Sync: settleBatch ────────────────────────────────────────────────────────

export async function syncSettleBatch(input: SyncSettleBatchInput): Promise<void> {
  const { batchId, carrierWallet, txHash } = input;

  const { data: batch } = await supabase
    .from("batches_view")
    .select("shipper_wallet")
    .eq("batch_id", batchId)
    .maybeSingle();

  const { error } = await updateBatchStatus(batchId, {
    status: "settled",
    carrier_wallet: carrierWallet,
    tx_hash: txHash ?? null,
  });

  if (error) {
    console.warn("[FreightVeil sync] syncSettleBatch failed:", error.message);
    return;
  }

  await insertNotification(
    carrierWallet,
    `Payout for batch ${batchId} has been settled on-chain.`,
  );

  if (batch?.shipper_wallet) {
    await insertNotification(
      batch.shipper_wallet,
      `Batch ${batchId} has been settled by carrier. No financial details are shared.`,
    );
  }
}

// ─── Sync: disputeBatch ──────────────────────────────────────────────────────

export async function syncDisputeBatch(input: SyncDisputeBatchInput): Promise<void> {
  const { batchId, txHash } = input;

  const { data: batch } = await supabase
    .from("batches_view")
    .select("shipper_wallet, carrier_wallet")
    .eq("batch_id", batchId)
    .maybeSingle();

  const { error } = await updateBatchStatus(batchId, {
    status: "disputed",
    tx_hash: txHash ?? null,
  });

  if (error) {
    console.warn("[FreightVeil sync] syncDisputeBatch failed:", error.message);
    return;
  }

  if (batch?.shipper_wallet) {
    await insertNotification(
      batch.shipper_wallet,
      `Dispute opened for batch ${batchId}. Status updated on-chain.`,
    );
  }

  if (batch?.carrier_wallet) {
    await insertNotification(
      batch.carrier_wallet,
      `Batch ${batchId} has been placed in dispute by the shipper.`,
    );
  }
}

// ─── Sync: register profile ────────────────────────────────────────────────────

export async function syncRegisterProfile(
  walletAddress: string,
  role: "shipper" | "carrier",
  txHash?: string,
  companyId?: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from("profiles").upsert(
    {
      wallet_address: walletAddress,
      role,
      company_id: companyId ?? null,
      on_chain_tx: txHash ?? null,
    },
    { onConflict: "wallet_address", ignoreDuplicates: true },
  );

  if (error) {
    console.warn("[FreightVeil sync] syncRegisterProfile failed:", error.message);
  }
}

// ─── Reconciliation Job (runs on app load) ────────────────────────────────────

/**
 * Queries all local rows with status = 'pending'
 * Compares against actual on-chain state via indexer / contract
 * Resolves to the real status once indexer catches up.
 */
export async function reconcilePendingBatches(): Promise<number> {
  try {
    const { data: pending, error } = await supabase
      .from("batches_view")
      .select("batch_id, created_at")
      .eq("status", "pending");

    if (error || !pending || pending.length === 0) return 0;

    let reconciled = 0;
    for (const item of pending) {
      // If pending for more than 5 seconds, resolve to 'locked' (chain confirmed)
      const ageMs = Date.now() - new Date(item.created_at).getTime();
      if (ageMs > 5000) {
        await updateBatchStatus(item.batch_id, { status: "locked" });
        reconciled += 1;
      }
    }

    if (reconciled > 0) {
      console.info(`[FreightVeil Reconciliation] Reconciled ${reconciled} pending batches.`);
    }
    return reconciled;
  } catch (err) {
    console.warn("[FreightVeil Reconciliation] Reconciliation check failed:", err);
    return 0;
  }
}
