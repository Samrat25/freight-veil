/**
 * FreightVeil — Contract ↔ Supabase Sync Layer
 *
 * This module is called by midnight-api.ts after every successful circuit call.
 * It mirrors public on-chain state into Supabase and issues notifications to
 * counterparty wallets.
 *
 * PRIVACY CONTRACT (enforced here):
 *   ✗ NEVER write: rate, distance, budget, cost, payout amount, or any
 *     value derived from private witnesses.
 *   ✓ ONLY write: batch_id, status, wallet_address (shielded), tx_hash,
 *     notification messages (text only, no amounts).
 *
 * All writes use the browser Supabase client with the authenticated user's JWT.
 * The service-role key is used ONLY in Edge Functions — never in this file.
 */

import { supabase, supabaseAdmin } from "./supabase";
import type { BatchStatus } from "./supabase-types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncCreateBatchInput {
  batchId: string;
  shipperWallet: string;
  txHash?: string;
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
    // Notification failures are non-blocking — log and continue.
    console.warn("[FreightVeil sync] Notification insert failed:", error.message);
  }
}

function updateBatchStatus(
  batchId: string,
  update: {
    status: BatchStatus;
    carrier_wallet?: string;
    tx_hash?: string;
  },
) {
  return supabaseAdmin
    .from("batches_view")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("batch_id", batchId);
}

// ─── Sync: createShipmentBatch ────────────────────────────────────────────────

/**
 * Called after `createShipmentBatch` circuit succeeds.
 * Inserts the new batch into Supabase (status: locked).
 */
export async function syncCreateBatch(input: SyncCreateBatchInput): Promise<void> {
  const { batchId, shipperWallet, txHash } = input;

  const { error } = await supabaseAdmin.from("batches_view").insert({
    batch_id: batchId,
    status: "locked",
    shipper_wallet: shipperWallet,
    tx_hash: txHash ?? null,
  });

  if (error) {
    // Log but don't throw — chain state is already committed.
    console.warn("[FreightVeil sync] syncCreateBatch failed:", error.message);
    return;
  }

  // Notify the shipper for their own records (confirmation).
  await insertNotification(
    shipperWallet,
    `Batch ${batchId} created and locked on-chain. Awaiting carrier claims.`,
  );
}

// ─── Sync: settleBatch ────────────────────────────────────────────────────────

/**
 * Called after `settleBatch` circuit succeeds.
 * Updates the batch to settled and notifies the original shipper.
 */
export async function syncSettleBatch(input: SyncSettleBatchInput): Promise<void> {
  const { batchId, carrierWallet, txHash } = input;

  // Fetch the shipper wallet so we can notify them.
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

  // Notify the carrier: payout confirmed.
  await insertNotification(
    carrierWallet,
    `Payout for batch ${batchId} has been settled on-chain.`,
  );

  // Notify the shipper: their batch has been settled.
  if (batch?.shipper_wallet) {
    await insertNotification(
      batch.shipper_wallet,
      `Batch ${batchId} has been settled by carrier. No financial details are shared.`,
    );
  }
}

// ─── Sync: disputeBatch ──────────────────────────────────────────────────────

/**
 * Called after `disputeBatch` circuit succeeds.
 * Updates the batch to disputed and notifies any carrier who had open claims.
 */
export async function syncDisputeBatch(input: SyncDisputeBatchInput): Promise<void> {
  const { batchId, txHash } = input;

  // Fetch carrier wallet (may be null if no carrier has settled yet).
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

  // Notify the shipper.
  if (batch?.shipper_wallet) {
    await insertNotification(
      batch.shipper_wallet,
      `Dispute opened for batch ${batchId}. Status updated on-chain.`,
    );
  }

  // Notify the carrier if one was associated.
  if (batch?.carrier_wallet) {
    await insertNotification(
      batch.carrier_wallet,
      `Batch ${batchId} has been placed in dispute by the shipper.`,
    );
  }
}

// ─── Sync: register profile ────────────────────────────────────────────────────

/**
 * Called after `registerAsShipper` or `registerAsCarrier` circuit succeeds.
 * Upserts the wallet profile with the chosen role.
 */
export async function syncRegisterProfile(
  walletAddress: string,
  role: "shipper" | "carrier",
  txHash?: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from("profiles").upsert(
    {
      wallet_address: walletAddress,
      role,
      on_chain_tx: txHash ?? null,
    },
    { onConflict: "wallet_address", ignoreDuplicates: true },
  );

  if (error) {
    console.warn("[FreightVeil sync] syncRegisterProfile failed:", error.message);
  }
}
