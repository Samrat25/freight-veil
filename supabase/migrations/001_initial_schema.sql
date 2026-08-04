-- FreightVeil — Supabase Migration 001: Initial Schema
-- ─────────────────────────────────────────────────────────────────────────────
--
-- PRIVACY CONTRACT:
--   This schema NEVER stores rate, distance, budget, freight cost, or payout
--   amounts. Those values exist exclusively as private witnesses inside the ZK
--   circuit on the user's local machine.
--
--   Supabase mirrors only what is already PUBLIC on the Midnight ledger:
--     • wallet_address (shielded address, not a real PK)
--     • role (shipper | carrier) — set once at registration
--     • batch_id, status, tx_hash — exact mirror of on-chain public state
--     • notification messages — UX convenience only
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────────────────────
-- One row per connected wallet. Created at first registration (on-chain
-- registerAsShipper / registerAsCarrier circuit call). Role is immutable after
-- first write.

create table if not exists profiles (
  wallet_address  text        primary key,
  role            text        not null check (role in ('shipper', 'carrier')),
  display_name    text,
  on_chain_tx     text,       -- tx_hash of the registerAs* circuit call
  created_at      timestamptz not null default now()
);

comment on table profiles is
  'One row per wallet. Mirrors the on-chain role commitment. No financial data.';

-- ─── batches_view ────────────────────────────────────────────────────────────
-- Mirrors the public ledger state of every shipment batch.
-- Populated/updated by the sync layer after successful circuit calls.

create table if not exists batches_view (
  batch_id        text        primary key,
  status          text        not null check (status in ('locked', 'settled', 'disputed')),
  shipper_wallet  text        references profiles (wallet_address),
  carrier_wallet  text        references profiles (wallet_address),
  tx_hash         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table batches_view is
  'Public mirror of on-chain batch state. No financial data stored here.';

-- Auto-update updated_at on every write
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger batches_view_updated_at
  before update on batches_view
  for each row execute function set_updated_at();

-- ─── notifications ────────────────────────────────────────────────────────────
-- UX-layer notifications for wallet counterparties.
-- e.g. "Carrier FV-XXXX has settled batch #YYY"

create table if not exists notifications (
  id              uuid        primary key default gen_random_uuid(),
  wallet_address  text        references profiles (wallet_address),
  message         text        not null,
  read            boolean     not null default false,
  created_at      timestamptz not null default now()
);

comment on table notifications is
  'UX notifications for wallet counterparties. No financial data.';

-- ─── batches_public (view) ───────────────────────────────────────────────────
-- Exactly what the public on-chain explorer would show any random observer.
-- Wallet columns are intentionally excluded.
-- Anyone with the anon key can SELECT from this view — that is by design,
-- because this is what the public Midnight block explorer would show anyway.

create or replace view batches_public as
  select
    batch_id,
    status,
    created_at,
    updated_at
  from batches_view;

comment on view batches_public is
  'Public read-only view — mirrors the Midnight block explorer. '
  'No wallet addresses or financial data visible.';
