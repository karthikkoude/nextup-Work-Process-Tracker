-- =====================================================
-- NestUp Work Process Tracker -- Database Schema
-- =====================================================
-- Tables: public.users, public.work_items, public.dependencies
-- RLS: Admin full CRUD on all tables. Member limited SELECT/UPDATE on work_items,
--       SELECT on own user row, no access to dependencies.
-- =====================================================

create extension if not exists "uuid-ossp";

-- =====================================================
-- 1. public.users
-- =====================================================
create table public.users (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  skills text[] not null default '{}'
);

create index idx_users_role on public.users (role);
create index idx_users_email on public.users (email);

alter table public.users enable row level security;

-- Helper: avoid recursive self-reference in RLS policies
create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

-- Admins: full CRUD on users
create policy "Admins full access to users"
  on public.users for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- Members: SELECT own row only
create policy "Members view own user row"
  on public.users for select to authenticated
  using (id = auth.uid());

-- =====================================================
-- 2. public.work_items
-- =====================================================
create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  status text not null default 'in-progress' check (status in ('blocked', 'in-progress', 'done')),
  assigned_to uuid not null references public.users(id) on delete cascade,
  required_skills text[] not null default '{}',
  blocked_reason text,
  progress_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_work_items_assigned_to on public.work_items (assigned_to);
create index idx_work_items_status on public.work_items (status);
create index idx_work_items_priority on public.work_items (priority);

alter table public.work_items enable row level security;

-- Admins: full CRUD on work_items
create policy "Admins full access to work_items"
  on public.work_items for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- Members: SELECT own assigned work items only
create policy "Members view all work items"
  on public.work_items for select to authenticated
  using (assigned_to = auth.uid());

-- Members: UPDATE own assigned items only
create policy "Members update own work items"
  on public.work_items for update to authenticated
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

-- =====================================================
-- 3. public.dependencies
-- =====================================================
create table public.dependencies (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.work_items(id) on delete cascade,
  to_id uuid not null references public.work_items(id) on delete cascade,
  type text not null check (type in ('partial', 'full')),
  threshold integer not null check (threshold >= 0 and threshold <= 100),
  constraint no_self_dependency check (from_id != to_id)
);

create index idx_dependencies_from_id on public.dependencies (from_id);
create index idx_dependencies_to_id on public.dependencies (to_id);

alter table public.dependencies enable row level security;

-- Admins: full CRUD on dependencies
create policy "Admins full access to dependencies"
  on public.dependencies for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- Members: NO access to dependencies (no policies = implicit deny)

-- =====================================================
-- Trigger: Auto-update updated_at on work_items
-- =====================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = public;

create trigger set_work_items_updated_at
  before update on public.work_items
  for each row
  execute function public.handle_updated_at();
