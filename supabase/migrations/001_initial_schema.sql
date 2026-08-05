-- FreightVeil — Supabase Migration 001: Initial Schema
-- ─────────────────────────────────────────────────────────────────────────────
-- PRIVACY CONTRACT:
--   This schema NEVER stores rate, distance, budget, freight cost, or payout
--   amounts. Those values exist exclusively as private witnesses inside the ZK
--   circuit on the user's local machine.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ─── companies ───────────────────────────────────────────────────────────────
create table if not exists companies (
  company_id  uuid        primary key default gen_random_uuid(),
  name        text        not null,
  created_at  timestamptz default now()
);

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  wallet_address  text        primary key,
  role            text        not null check (role in ('shipper', 'carrier')),
  company_id      uuid        references companies(company_id),
  display_name    text,
  on_chain_tx     text,
  created_at      timestamptz default now()
);

-- ─── batches_view ────────────────────────────────────────────────────────────
create table if not exists batches_view (
  batch_id        text        primary key,
  status          text        not null check (status in ('pending', 'locked', 'settled', 'disputed')),
  shipper_wallet  text        references profiles(wallet_address),
  carrier_wallet  text        references profiles(wallet_address),
  company_id      uuid        references companies(company_id),
  tx_hash         text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-update updated_at on write
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists batches_view_updated_at on batches_view;
create trigger batches_view_updated_at
  before update on batches_view
  for each row execute function set_updated_at();

-- ─── notifications ────────────────────────────────────────────────────────────
create table if not exists notifications (
  id              uuid        primary key default gen_random_uuid(),
  wallet_address  text        references profiles(wallet_address),
  message         text        not null,
  read            boolean     default false,
  created_at      timestamptz default now()
);

-- ─── batches_public (view) ───────────────────────────────────────────────────
create or replace view batches_public as
  select
    batch_id,
    status,
    created_at,
    updated_at
  from batches_view;
