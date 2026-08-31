-- Legal Metrology Compliance -- Supabase schema (single officer-panel MVP)
-- Run in the Supabase SQL editor for a fresh project.

create extension if not exists pg_trgm;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name_raw text not null,
  name_normalized text not null unique,
  total_scans integer not null default 0,
  non_compliant_count integer not null default 0,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table if not exists public.scans (
  id uuid primary key,
  product_name text not null,
  officer_id uuid references auth.users(id),
  overall_status text not null check (overall_status in ('pass', 'potential_non_compliance', 'review_required')),
  calibrated boolean not null default false,
  declarations jsonb not null default '[]',
  structural_flags jsonb not null default '[]',
  evidence_urls text[] not null default '{}',
  company_id uuid references public.companies(id),
  re_scan_of uuid references public.scans(id),
  panels_photographed integer not null default 1,
  image_width integer,
  image_height integer,
  created_at timestamptz not null default now()
);

create index if not exists scans_product_name_idx on public.scans using gin (product_name gin_trgm_ops);
create index if not exists scans_created_at_idx on public.scans (created_at desc);
create index if not exists scans_company_id_idx on public.scans (company_id);
create index if not exists companies_name_normalized_idx on public.companies (name_normalized);

alter table public.scans enable row level security;
alter table public.companies enable row level security;

-- Single role (officer) -- every authenticated user can read/write the
-- shared repository. No admin/authority split in this MVP.
create policy "authenticated users can read all scans"
  on public.scans for select to authenticated using (true);

create policy "authenticated users can insert their own scans"
  on public.scans for insert to authenticated
  with check (officer_id = auth.uid());

create policy "authenticated users can read companies"
  on public.companies for select to authenticated using (true);

create policy "authenticated users can upsert companies"
  on public.companies for insert to authenticated with check (true);

create policy "authenticated users can update companies"
  on public.companies for update to authenticated using (true);

-- Storage bucket "evidence-photos" (create via dashboard or Storage API):
-- private, served through the API rather than public access.
