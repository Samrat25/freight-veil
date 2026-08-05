-- FreightVeil — Supabase Migration 002: Row Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────
-- Auth model: custom JWT issued by backend after verifying a wallet signature.
-- The JWT subject claim (sub) equals the wallet_address.
-- Supabase exposes it as: auth.jwt() ->> 'sub'
-- ─────────────────────────────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table batches_view enable row level security;
alter table notifications enable row level security;

-- ─── profiles RLS ─────────────────────────────────────────────────────────────
drop policy if exists "own profile only" on profiles;
create policy "own profile only"
  on profiles for select
  using (wallet_address = auth.jwt() ->> 'sub');

drop policy if exists "update own profile only" on profiles;
create policy "update own profile only"
  on profiles for update
  using (wallet_address = auth.jwt() ->> 'sub');

drop policy if exists "self insert profile" on profiles;
create policy "self insert profile"
  on profiles for insert
  with check (wallet_address = auth.jwt() ->> 'sub' or auth.role() = 'service_role');

-- ─── batches_view RLS ─────────────────────────────────────────────────────────
drop policy if exists "shipper sees own company batches" on batches_view;
create policy "shipper sees own company batches"
  on batches_view for select
  using (
    shipper_wallet = auth.jwt() ->> 'sub'
    and (
      company_id is null
      or company_id = (
        select company_id from profiles where wallet_address = auth.jwt() ->> 'sub'
      )
    )
  );

drop policy if exists "carrier sees assigned or locked batches" on batches_view;
create policy "carrier sees assigned or locked batches"
  on batches_view for select
  using (
    carrier_wallet = auth.jwt() ->> 'sub'
    or status = 'locked'
    or status = 'pending'
  );

drop policy if exists "service insert batches" on batches_view;
create policy "service insert batches"
  on batches_view for insert
  with check (auth.role() = 'service_role' or shipper_wallet = auth.jwt() ->> 'sub');

drop policy if exists "service update batches" on batches_view;
create policy "service update batches"
  on batches_view for update
  using (auth.role() = 'service_role' or shipper_wallet = auth.jwt() ->> 'sub' or carrier_wallet = auth.jwt() ->> 'sub');

-- ─── notifications RLS ────────────────────────────────────────────────────────
drop policy if exists "own notifications only" on notifications;
create policy "own notifications only"
  on notifications for select
  using (wallet_address = auth.jwt() ->> 'sub');

drop policy if exists "service insert notifications" on notifications;
create policy "service insert notifications"
  on notifications for insert
  with check (auth.role() = 'service_role');

-- ─── batches_public view grants ───────────────────────────────────────────────
grant select on batches_public to anon;
grant select on batches_public to authenticated;
