-- Fantasy Big Brother: league sync (v1 JSON blob per league)
-- Run in Supabase SQL Editor after creating a project.

create table if not exists public.leagues (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists leagues_updated_at_idx on public.leagues (updated_at desc);

-- v2 migration (existing deploys): invite lookup + live draft
alter table public.leagues add column if not exists invite_code text unique;
create index if not exists leagues_invite_code_idx on public.leagues (invite_code);

-- Realtime: enable in Dashboard → Database → Replication, or run:
-- alter publication supabase_realtime add table public.leagues;

alter table public.leagues enable row level security;

-- v1: open read/write for anon (friends/league use). Tighten RLS for production.
create policy "leagues_select_anon"
  on public.leagues for select
  to anon, authenticated
  using (true);

create policy "leagues_insert_anon"
  on public.leagues for insert
  to anon, authenticated
  with check (true);

create policy "leagues_update_anon"
  on public.leagues for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "leagues_delete_anon"
  on public.leagues for delete
  to anon, authenticated
  using (true);
