-- Single-organization setup for Dealer Recon Tracker
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.recon_vehicles (
  id uuid primary key,
  organization_id text not null,
  stock_number text,
  vin text,
  color text,
  year text,
  make text,
  model text,
  notes text default '',
  status text not null,
  created_at timestamptz not null default now(),
  stage_entered_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_recon_vehicles_org on public.recon_vehicles (organization_id);
create index if not exists idx_recon_vehicles_status on public.recon_vehicles (status);
create index if not exists idx_recon_vehicles_created_at on public.recon_vehicles (created_at desc);

create table if not exists public.recon_audit_events (
  id bigint generated always as identity primary key,
  organization_id text not null,
  actor_email text,
  action text not null,
  stock_number text,
  year text,
  make text,
  model text,
  status text,
  event_time timestamptz not null default now()
);

create index if not exists idx_recon_audit_org on public.recon_audit_events (organization_id);
create index if not exists idx_recon_audit_event_time on public.recon_audit_events (event_time desc);

create table if not exists public.recon_stage_sla_targets (
  organization_id text not null,
  status text not null,
  target_hours integer not null,
  updated_at timestamptz not null default now(),
  primary key (organization_id, status)
);

alter table public.recon_vehicles enable row level security;
alter table public.recon_audit_events enable row level security;
alter table public.recon_stage_sla_targets enable row level security;

-- Single-org policy (replace 'default-org' if you choose a different org id)
drop policy if exists recon_vehicles_single_org on public.recon_vehicles;
create policy recon_vehicles_single_org on public.recon_vehicles
for all to authenticated
using (organization_id = 'default-org')
with check (organization_id = 'default-org');

drop policy if exists recon_audit_single_org on public.recon_audit_events;
create policy recon_audit_single_org on public.recon_audit_events
for all to authenticated
using (organization_id = 'default-org')
with check (organization_id = 'default-org');

drop policy if exists recon_sla_single_org on public.recon_stage_sla_targets;
create policy recon_sla_single_org on public.recon_stage_sla_targets
for all to authenticated
using (organization_id = 'default-org')
with check (organization_id = 'default-org');

-- Seed default SLA values.
insert into public.recon_stage_sla_targets (organization_id, status, target_hours)
values
  ('default-org', 'New Inventory Received', 72),
  ('default-org', 'Pending Inspection', 72),
  ('default-org', 'Awaiting Parts', 72),
  ('default-org', 'Approved for Reconditioning', 72),
  ('default-org', 'Reconditioning in Progress', 72),
  ('default-org', 'Frontline Ready', 72)
on conflict (organization_id, status) do update
set target_hours = excluded.target_hours,
    updated_at = now();
