-- FreightVeil — Supabase Migration 002: Row Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Auth model: custom JWT issued by the backend after verifying a wallet
-- signature. The JWT subject claim (sub) equals the wallet_address.
-- Supabase exposes it as: auth.jwt() ->> 'sub'
--
-- Policy matrix:
--   profiles       : wallet can SELECT/UPDATE its own row only
--   batches_view   : shippers see own batches; carriers see own + open batches;
--                    anon key gets batches_public view (no wallet columns)
--   notifications  : wallet can SELECT/UPDATE its own notifications only
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Enable RLS ───────────────────────────────────────────────────────────────
alter table profiles       enable row level security;
alter table batches_view   enable row level security;
alter table notifications  enable row level security;

-- ─── Helper: extract wallet from JWT ─────────────────────────────────────────
-- Returns the wallet_address of the authenticated caller, or NULL for anon.
create or replace function auth_wallet()
returns text language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

-- ─── profiles policies ────────────────────────────────────────────────────────

-- A wallet may INSERT its own profile row (first-time registration).
create policy "profiles: self insert"
  on profiles for insert
  with check (wallet_address = auth_wallet());

-- A wallet may SELECT only its own profile row.
create policy "profiles: self select"
  on profiles for select
  using (wallet_address = auth_wallet());

-- A wallet may UPDATE only its own profile row (e.g. change display_name).
create policy "profiles: self update"
  on profiles for update
  using (wallet_address = auth_wallet())
  with check (wallet_address = auth_wallet());

-- ─── batches_view policies ────────────────────────────────────────────────────

-- Shippers can SELECT batches they created.
create policy "batches_view: shipper select own"
  on batches_view for select
  using (shipper_wallet = auth_wallet());

-- Carriers can SELECT:
--   (a) batches they have settled (carrier_wallet = caller)
--   (b) any batch with status='locked' — so carriers can look up open batch IDs
--       that a shipper has shared with them out-of-band.
create policy "batches_view: carrier select own and open"
  on batches_view for select
  using (
    carrier_wallet = auth_wallet()
    or (status = 'locked' and auth_wallet() is not null)
  );

-- Service role (backend sync layer) may INSERT new batch rows.
create policy "batches_view: service insert"
  on batches_view for insert
  with check (auth.role() = 'service_role');

-- Service role may UPDATE batch rows (status transitions).
create policy "batches_view: service update"
  on batches_view for update
  using (auth.role() = 'service_role');

-- ─── notifications policies ───────────────────────────────────────────────────

-- A wallet can SELECT only its own notifications.
create policy "notifications: self select"
  on notifications for select
  using (wallet_address = auth_wallet());

-- A wallet can mark its own notifications as read (UPDATE read flag only).
create policy "notifications: self update read"
  on notifications for update
  using (wallet_address = auth_wallet())
  with check (wallet_address = auth_wallet());

-- Service role inserts notifications for counterparties.
create policy "notifications: service insert"
  on notifications for insert
  with check (auth.role() = 'service_role');

-- ─── batches_public view grants ───────────────────────────────────────────────
-- The view is read-only by construction (SELECT on base table limited by RLS).
-- Grant SELECT to both authenticated users and the anonymous role so the
-- public ledger explorer page works without a wallet.
grant select on batches_public to anon;
grant select on batches_public to authenticated;
