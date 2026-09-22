-- =============================================================================
-- AI Manager Portal — schema, row-level security, and the assign transaction.
--
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Afterwards, promote yourself to admin with the statement at the bottom.
-- =============================================================================

create type user_role as enum ('business', 'manager', 'admin');
create type project_status as enum ('open', 'assigned', 'in_progress', 'completed', 'cancelled');
create type assignment_status as enum ('active', 'completed', 'cancelled');

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table profiles (
  id         uuid primary key references auth.users on delete cascade,
  role       user_role not null default 'business',
  full_name  text,
  company    text,
  created_at timestamptz not null default now()
);

create table projects (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references profiles(id) on delete cascade,
  title        text not null,
  summary      text not null,
  budget_range text,
  timeline     text,
  status       project_status not null default 'open',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index projects_owner_idx on projects (owner_id);
create index projects_status_idx on projects (status);

-- Assignment is its own table rather than a projects.manager_id column. It
-- keeps a history of who held the work, and it is the row a future `bids`
-- table gets promoted into when a business accepts a bid — so adding bidding
-- later does not require reshaping projects.
create table assignments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  manager_id  uuid not null references profiles(id) on delete cascade,
  assigned_by uuid not null references profiles(id),
  status      assignment_status not null default 'active',
  note        text,
  created_at  timestamptz not null default now()
);

-- A project can only be live with one manager at a time. Past assignments stay
-- as 'completed'/'cancelled' rows.
create unique index assignments_one_active_per_project
  on assignments (project_id) where status = 'active';

create index assignments_manager_idx on assignments (manager_id);

-- -----------------------------------------------------------------------------
-- Helpers
--
-- security definer so they can read `profiles` without tripping the policies
-- defined on `profiles` itself — a policy that selects from its own table
-- recurses infinitely.
-- -----------------------------------------------------------------------------

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function owns_project(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from projects where id = p_project_id and owner_id = auth.uid()
  )
$$;

-- -----------------------------------------------------------------------------
-- Guards
-- -----------------------------------------------------------------------------

-- Without this, any signed-in user could PATCH their own profile row and make
-- themselves an admin, which would expose every project in the system.
--
-- auth.uid() is NULL in the SQL editor and under the service_role key. Those
-- are trusted server-side contexts and are how roles are granted in the first
-- place — including the very first admin, who by definition cannot be promoted
-- by an existing one. So the guard only bites when a request carries a JWT.
create or replace function guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not is_admin() then
    raise exception 'Only an admin can change a role';
  end if;
  return new;
end
$$;

create trigger profiles_guard_role
  before update on profiles
  for each row execute function guard_role_change();

-- Status is driven by assignment and by admin action, never by the business
-- editing its own row. RLS is row-level, so a trigger is the tool for
-- restricting a single column. Same JWT carve-out as guard_role_change, so
-- data can still be corrected from the SQL editor.
create or replace function guard_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and auth.uid() is not null
     and not is_admin() then
    raise exception 'Only an admin can change a project status';
  end if;
  new.updated_at := now();
  return new;
end
$$;

create trigger projects_guard_status
  before update on projects
  for each row execute function guard_status_change();

-- Every auth user gets a profile, defaulting to the 'business' role.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, company)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'company', '')
  );
  return new;
end
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -----------------------------------------------------------------------------
-- Assigning a project
--
-- Creating the assignment and flipping the project status must not be two
-- round trips a client could half-complete, so it is one function. It also
-- centralises the admin check rather than trusting the caller.
-- -----------------------------------------------------------------------------

create or replace function assign_project(
  p_project_id uuid,
  p_manager_id uuid,
  p_note       text default null
)
returns assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row assignments;
begin
  if not is_admin() then
    raise exception 'Only an admin can assign a project';
  end if;

  if not exists (select 1 from profiles where id = p_manager_id and role = 'manager') then
    raise exception 'Target user is not an AI Manager';
  end if;

  -- Retire any current holder so the partial unique index stays satisfied.
  update assignments
     set status = 'cancelled'
   where project_id = p_project_id
     and status = 'active';

  insert into assignments (project_id, manager_id, assigned_by, note)
  values (p_project_id, p_manager_id, auth.uid(), nullif(p_note, ''))
  returning * into v_row;

  update projects
     set status = 'assigned', updated_at = now()
   where id = p_project_id;

  return v_row;
end
$$;

-- -----------------------------------------------------------------------------
-- Listing people, with their email
--
-- Email lives in auth.users, which PostgREST does not expose to the client —
-- correctly, since it would hand every signed-in user the address of everyone
-- else. Copying it into profiles would go stale the moment someone changes it,
-- so this joins it live instead.
--
-- security definer is what allows reading auth.users at all, and the
-- `where is_admin()` guard is the entire reason that is safe: for anyone else
-- the function returns no rows.
-- -----------------------------------------------------------------------------

create or replace function admin_list_people()
returns table (
  id         uuid,
  role       user_role,
  full_name  text,
  company    text,
  email      text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.role, p.full_name, p.company, u.email::text, p.created_at
    from profiles p
    join auth.users u on u.id = p.id
   where is_admin()
   order by p.created_at desc
$$;

revoke execute on function admin_list_people() from anon;
grant execute on function admin_list_people() to authenticated;

-- -----------------------------------------------------------------------------
-- Row-level security
-- -----------------------------------------------------------------------------

alter table profiles    enable row level security;
alter table projects    enable row level security;
alter table assignments enable row level security;

-- profiles ---------------------------------------------------------------------

-- Manager rows are readable by any signed-in user so a business can see who
-- their project went to, and so the admin picker can list them. Tighten this
-- if manager profiles should be private.
create policy profiles_select on profiles
  for select to authenticated
  using (id = auth.uid() or role = 'manager' or is_admin());

create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- No insert policy: rows come only from the handle_new_user trigger.

-- projects ---------------------------------------------------------------------

create policy projects_select on projects
  for select to authenticated
  using (
    owner_id = auth.uid()
    or is_admin()
    or exists (
      select 1 from assignments a
       where a.project_id = projects.id
         and a.manager_id = auth.uid()
         and a.status = 'active'
    )
  );

create policy projects_insert_own on projects
  for insert to authenticated
  with check (owner_id = auth.uid());

-- Businesses may keep editing the brief until it is assigned; admins always.
-- The status column itself is protected by projects_guard_status above.
create policy projects_update on projects
  for update to authenticated
  using ((owner_id = auth.uid() and status = 'open') or is_admin())
  with check ((owner_id = auth.uid() and status = 'open') or is_admin());

create policy projects_delete_own on projects
  for delete to authenticated
  using ((owner_id = auth.uid() and status = 'open') or is_admin());

-- assignments ------------------------------------------------------------------

create policy assignments_select on assignments
  for select to authenticated
  using (manager_id = auth.uid() or is_admin() or owns_project(project_id));

-- Direct writes are admin-only; the normal path is assign_project().
create policy assignments_insert_admin on assignments
  for insert to authenticated with check (is_admin());

create policy assignments_update_admin on assignments
  for update to authenticated using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- Grants. RLS is the gate; these just make the tables reachable at all.
-- -----------------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, insert, update, delete on profiles, projects, assignments to authenticated;
grant execute on function assign_project(uuid, uuid, text) to authenticated;
grant execute on function is_admin() to authenticated;

-- =============================================================================
-- After signing in once through the app, promote yourself. Replace the email.
--
--   update profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'you@aimnow.io');
--
-- Create an AI Manager the same way, with role = 'manager'. They must sign in
-- once first so the auth user and profile exist.
-- =============================================================================
