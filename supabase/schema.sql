-- =============================================================================
-- AI Manager Portal — schema, row-level security, and the assign transaction.
--
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Afterwards, promote yourself to admin with the statement at the bottom.
-- =============================================================================

-- 'applicant' sits between business and manager: someone who has asked to join
-- the network but hasn't been vetted. It exists because the two states it used
-- to be squeezed into were both wrong. Left as 'business' they land on the
-- business dashboard, which has no certificates form — so they cannot do the
-- one thing sign-up tells them to do. Promoted straight to 'manager' they
-- become visible to every signed-in user through profiles_select, before
-- anyone has checked a single credential.
--
-- It grants nothing: not publicly listed, not assignable (assign_project
-- requires 'manager'), no wider read than a business has. All it unlocks is
-- the manager dashboard, and with it the ability to submit certificates for
-- review.
create type user_role as enum ('business', 'manager', 'admin', 'applicant');
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
  -- AI Manager credentials: [{ "name": "...", "url": "https://verify..." }].
  -- Every entry must carry a verification link on a recognised issuer's
  -- domain — see certificates_valid() below, which the check constraint
  -- enforces. Projects delivered is deliberately NOT stored here: it is
  -- counted from completed assignments, so "ranked on real delivery" stays
  -- true rather than being a number someone types about themselves.
  certificates jsonb not null default '[]'::jsonb,
  -- What they said they were when signing up. Deliberately separate from
  -- `role`: this is a request, and granting it is an admin decision made after
  -- checking their certificates. Constrained so it can never carry 'admin'.
  signup_as text check (signup_as in ('business', 'manager')),
  -- Which plan a business is on. Only an admin may change it — see
  -- guard_plan_change() — because it decides how many projects they can post.
  -- Managers and admins carry 'free' and are simply never limited.
  plan text not null default 'free' check (plan in ('free', 'premium', 'enterprise')),
  -- Work delivered outside the Portal: [{ "title", "summary", "url" }].
  -- Self-reported, and labelled as such wherever it is shown. It deliberately
  -- does not feed the delivered count, which stays derived from completed
  -- assignments so that number keeps meaning something.
  personal_projects jsonb not null default '[]'::jsonb,
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

-- Messages between AIM Now and one person. There is no threads table: a
-- conversation IS a person_id, because every thread has the same two sides —
-- that person, and whichever admin happens to answer. Admins are deliberately
-- interchangeable here, so a handover doesn't orphan a conversation.
--
-- Project-scoped threads were the alternative. They read better in context,
-- but they can't carry the conversation that actually needed having — chasing
-- a manager about their certificates, before any project exists.
create table messages (
  id         uuid primary key default gen_random_uuid(),
  -- The non-admin side of the thread, and the thread's identity.
  person_id  uuid not null references profiles(id) on delete cascade,
  sender_id  uuid not null references profiles(id) on delete cascade,
  -- Derived from the two above by set_message_direction(), never trusted from
  -- the client. Stored rather than computed on read because PostgREST can't
  -- filter one column against another, and every unread count needs exactly
  -- that comparison.
  from_admin boolean not null default false,
  body       text not null check (btrim(body) <> ''),
  -- Set by mark_messages_read() when the other side opens the thread. Null
  -- means unread; there is no per-admin read state, since any admin reading it
  -- counts as AIM Now having read it.
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index messages_person_idx on messages (person_id, created_at);

-- Serves both unread badges: the person's own, and the admin list's.
create index messages_unread_idx on messages (person_id, from_admin) where read_at is null;

-- -----------------------------------------------------------------------------
-- Certificates
--
-- What makes a certificate count is an admin opening the link and approving it
-- — see set_certificate_approval() and the two-approved gate in
-- assign_project(). An issuer allowlist used to sit here as well, but it only
-- ever guessed at what review decides for certain, and it turned away valid
-- credentials from issuers nobody had thought to add.
--
-- So the shape check keeps to what a database can actually know: a name, and
-- an https link. https matters beyond tidiness — these links are rendered as
-- hrefs, and javascript: would be an href too.
-- -----------------------------------------------------------------------------

create or replace function certificates_valid(certs jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(certs) = 'array'
     and not exists (
       select 1
       from jsonb_array_elements(certs) c
       where jsonb_typeof(c) <> 'object'
          or coalesce(btrim(c->>'name'), '') = ''
          or coalesce(c->>'url', '') !~ '^https://[^/?#\s]+'
     )
$$;

alter table profiles
  add constraint profiles_certificates_verifiable check (certificates_valid(certificates));

-- Personal projects are free-form, so only the shape is checked: a title is
-- required, and a link if given must at least be https rather than something
-- that would render as a broken or hostile href.
create or replace function personal_projects_valid(items jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(items) = 'array'
     and not exists (
       select 1
       from jsonb_array_elements(items) p
       where jsonb_typeof(p) <> 'object'
          or coalesce(btrim(p->>'title'), '') = ''
          or (coalesce(p->>'url', '') <> '' and p->>'url' !~ '^https://')
     )
$$;

alter table profiles
  add constraint profiles_personal_projects_shape check (personal_projects_valid(personal_projects));

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

-- The plan is what the project limit is read from, so leaving it writable
-- would make the limit advisory: a business could PATCH themselves onto
-- 'enterprise' and post as much as they liked. Same NULL-uid exemption as
-- above, so the SQL editor and service_role can still set it.
create or replace function guard_plan_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.plan is distinct from old.plan
     and auth.uid() is not null
     and not is_admin() then
    raise exception 'Only an admin can change a plan';
  end if;
  return new;
end
$$;

create trigger profiles_guard_plan
  before update on profiles
  for each row execute function guard_plan_change();

-- Approval is what makes "verified" mean anything, and profiles.certificates
-- is the manager's own row — so without this they could simply mark their own
-- claims approved and clear the two-certificate gate on assignment.
--
-- A manager may still add and remove certificates freely; the flag just isn't
-- theirs to set. Existing approvals are carried across by url, and anything
-- new arrives unapproved.
create or replace function guard_certificate_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return new;
  end if;

  select coalesce(
           jsonb_agg(
             c || jsonb_build_object(
               'approved',
               coalesce((
                 select (o->>'approved')::boolean
                   from jsonb_array_elements(coalesce(old.certificates, '[]'::jsonb)) o
                  where o->>'url' = c->>'url'
                  limit 1
               ), false)
             )
           ),
           '[]'::jsonb
         )
    into new.certificates
    from jsonb_array_elements(coalesce(new.certificates, '[]'::jsonb)) c;

  return new;
end
$$;

create trigger profiles_guard_certificate_approval
  before update on profiles
  for each row execute function guard_certificate_approval();

-- Approving from the client would be a read-modify-write race, and the admin
-- check belongs on the server rather than in the screen that calls it.
create or replace function set_certificate_approval(
  p_profile_id uuid,
  p_url        text,
  p_approved   boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an admin can approve a certificate';
  end if;

  update profiles
     set certificates = (
       select coalesce(
                jsonb_agg(
                  case when c->>'url' = p_url
                       then c || jsonb_build_object('approved', p_approved)
                       else c
                  end
                ),
                '[]'::jsonb
              )
         from jsonb_array_elements(certificates) c
     )
   where id = p_profile_id;
end
$$;

grant execute on function set_certificate_approval(uuid, text, boolean) to authenticated;

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

-- from_admin is what both unread badges filter on, so it can't be a value the
-- sender supplies. It is fully determined by the other two columns: anyone
-- writing into a thread that isn't their own is, by the insert policy, an
-- admin. Recomputed on update too, though nothing is allowed to update a
-- message's body — see the lack of an update policy.
create or replace function set_message_direction()
returns trigger
language plpgsql
as $$
begin
  new.from_admin := new.sender_id is distinct from new.person_id;
  return new;
end
$$;

create trigger messages_set_direction
  before insert or update on messages
  for each row execute function set_message_direction();

-- Marking read is the only legitimate change to an existing message, and it
-- belongs to whichever side didn't write it. There is deliberately no update
-- policy on messages, so this function is the only route — which also means a
-- body can never be edited after the fact.
create or replace function mark_messages_read(p_person_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = p_person_id then
    -- The person is reading what AIM Now sent them.
    update messages
       set read_at = now()
     where person_id = p_person_id
       and from_admin
       and read_at is null;
  elsif is_admin() then
    -- An admin is reading what the person sent. Any admin clears it: they
    -- answer as one voice, so a second admin shouldn't see it as unread.
    update messages
       set read_at = now()
     where person_id = p_person_id
       and not from_admin
       and read_at is null;
  else
    raise exception 'Not your conversation';
  end if;
end
$$;

grant execute on function mark_messages_read(uuid) to authenticated;

-- The free plan is one project. Enforced here rather than in an RLS `with
-- check` clause for the message: a policy refusal surfaces as "new row
-- violates row-level security policy", which tells a business nothing about
-- what to do next, and the screen can't tell it apart from being signed out.
--
-- Cancelled projects don't count, so a business that abandons an idea gets its
-- slot back rather than being stuck with a dead row. Deleting one frees it too.
--
-- Admins are exempt so they can post on someone's behalf, and the limit is
-- read from the owner's plan rather than the caller's — an admin posting for a
-- free business still fills that business's one slot.
create or replace function enforce_project_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan  text;
  v_count integer;
begin
  if is_admin() then
    return new;
  end if;

  select plan into v_plan from profiles where id = new.owner_id;

  -- Only the free plan is capped. Paid plans are unlimited, and a NULL plan
  -- (a profile row predating the column) is treated as free.
  if coalesce(v_plan, 'free') <> 'free' then
    return new;
  end if;

  select count(*)
    into v_count
    from projects
   where owner_id = new.owner_id
     and status <> 'cancelled';

  -- Two inserts racing could both read 0 and both pass. A unique index would
  -- close that, but it would cap paid plans at one project too, so this is
  -- left as it is: the cost is a business briefly having two rows, and an
  -- admin can cancel one.
  if v_count >= 1 then
    raise exception 'PROJECT_LIMIT_REACHED'
      using hint = 'The free plan covers one project. Upgrade to post another.';
  end if;

  return new;
end
$$;

create trigger projects_enforce_limit
  before insert on projects
  for each row execute function enforce_project_limit();

-- Every auth user gets a profile.
--
-- The metadata is whatever the browser sent, so it can never grant anything:
-- honouring a claim of 'admin' or 'manager' would let anyone read every
-- project in the system, or list themselves as vetted. It is read here for two
-- things only — the name and company they typed, and whether they said they
-- were applying to build.
--
-- 'applicant' is a role the browser may ask for because it confers nothing
-- (see the enum at the top of this file). Without it a new applicant would sit
-- at 'business' and never find the certificates form, which is the next thing
-- sign-up tells them to do. 'manager' remains an admin's decision, made after
-- those certificates have been opened and checked.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wants_manager boolean := new.raw_user_meta_data->>'signup_as' = 'manager';
begin
  insert into profiles (id, full_name, company, signup_as, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'company', ''),
    case when v_wants_manager then 'manager' else 'business' end,
    case when v_wants_manager then 'applicant' else 'business' end::user_role
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
  v_row   assignments;
  v_certs integer;
begin
  if not is_admin() then
    raise exception 'Only an admin can assign a project';
  end if;

  if not exists (select 1 from profiles where id = p_manager_id and role = 'manager') then
    raise exception 'Target user is not an AI Manager';
  end if;

  -- The FAQ tells businesses that every AI Manager holds at least two verified
  -- certifications. Checking it here rather than in the admin screen is what
  -- keeps that claim true: the screen can be bypassed, this cannot.
  --
  -- Only approved ones count. A manager can add any link on an allowed host,
  -- so counting unapproved claims would let them clear this gate themselves.
  select count(*)
    into v_certs
    from profiles p,
         lateral jsonb_array_elements(coalesce(p.certificates, '[]'::jsonb)) c
   where p.id = p_manager_id
     and (c->>'approved')::boolean is true;

  if v_certs < 2 then
    raise exception
      'This AI Manager has % verified certificate(s). At least 2 are required before assignment.', v_certs;
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

-- Returns the whole profile as jsonb rather than a column per field. Naming
-- each one meant every new profile column changed the return type, and
-- Postgres refuses that on `create or replace` — so each addition needed a drop
-- and recreate. The client flattens `profile` back out, so adding a column here
-- now needs no migration at all.
create or replace function admin_list_people()
returns table (
  id      uuid,
  email   text,
  profile jsonb
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, u.email::text, to_jsonb(p)
    from profiles p
    join auth.users u on u.id = p.id
   where is_admin()
   order by p.created_at desc
$$;

-- -----------------------------------------------------------------------------
-- Deleting a person
--
-- The real record is the auth.users row — profiles.id references it with
-- `on delete cascade`, and everything else hangs off profiles the same way.
-- Deleting the profile alone would leave someone who can still sign in but has
-- no profile, and handle_new_user only fires on insert, so it would never come
-- back. So the delete has to happen in auth.users, which PostgREST does not
-- expose. Hence security definer.
-- -----------------------------------------------------------------------------

-- What a delete would destroy, so the confirmation can say it rather than the
-- admin finding out afterwards. Returns null for anyone who isn't an admin,
-- which the client treats as "not allowed" rather than "nothing attached".
create or replace function admin_person_impact(p_person_id uuid)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select case when is_admin() then jsonb_build_object(
    'projects',    (select count(*) from projects   where owner_id   = p_person_id),
    'assignments', (select count(*) from assignments where manager_id = p_person_id),
    'messages',    (select count(*) from messages   where person_id  = p_person_id),
    'assigned',    (select count(*) from assignments where assigned_by = p_person_id)
  ) end
$$;

revoke execute on function admin_person_impact(uuid) from anon;
grant execute on function admin_person_impact(uuid) to authenticated;

create or replace function admin_delete_person(p_person_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an admin can delete a person';
  end if;

  -- The screen already makes your own row read-only, but the screen is not
  -- the gate. Deleting yourself would take your admin rights with it and
  -- leave nobody able to grant them back.
  if p_person_id = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;

  -- assignments.assigned_by deliberately has no cascade: it records who made
  -- a decision, and that record shouldn't vanish because someone left. Raised
  -- as a sentence rather than left to surface as a foreign-key violation.
  if exists (select 1 from assignments where assigned_by = p_person_id) then
    raise exception
      'This person has assigned projects. Assignment history records who decided, so it will not delete. Delete or reassign those projects first.';
  end if;

  -- Cascades from here: profile, their projects, assignments of those
  -- projects, assignments where they were the manager, and both sides of
  -- every message thread.
  delete from auth.users where id = p_person_id;
end
$$;

revoke execute on function admin_delete_person(uuid) from anon;
grant execute on function admin_delete_person(uuid) to authenticated;

-- Existing installs, for messaging: create the `messages` table above, then
-- set_message_direction() and mark_messages_read(), then its three policies
-- and the grant — all of them, since a table with RLS on and no policy is a
-- table nobody can read. The table is new, so there is nothing to backfill.
--
-- Existing installs, for the project limit:
--
--   alter table profiles
--     add column if not exists plan text not null default 'free'
--       check (plan in ('free', 'premium', 'enterprise'));
--
-- then create guard_plan_change() and enforce_project_limit() above with their
-- triggers. Businesses already holding more than one project keep them — the
-- trigger is on insert, so it only stops the next one.
--
-- Existing installs: create certificates_valid() first, then add the column
-- and its constraint.
--
--   alter table profiles
--     add column if not exists certificates jsonb not null default '[]'::jsonb;
--   alter table profiles
--     add constraint profiles_certificates_verifiable check (certificates_valid(certificates));
--
-- If the column already exists as text[] — an earlier revision of this file
-- created it that way — convert it first. `add column if not exists` will not
-- change the type of a column that is already there, and the constraint then
-- fails with "function certificates_valid(text[]) does not exist". Drop the
-- default before the type change, or Postgres tries to cast '{}' to jsonb.
--
--   alter table profiles
--     alter column certificates drop default,
--     alter column certificates type jsonb using '[]'::jsonb,
--     alter column certificates set default '[]'::jsonb;

revoke execute on function admin_list_people() from anon;
grant execute on function admin_list_people() to authenticated;

-- -----------------------------------------------------------------------------
-- Row-level security
-- -----------------------------------------------------------------------------

alter table profiles    enable row level security;
alter table projects    enable row level security;
alter table assignments enable row level security;
alter table messages    enable row level security;

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

-- messages ---------------------------------------------------------------------

create policy messages_select on messages
  for select to authenticated
  using (person_id = auth.uid() or is_admin());

-- One clause covers both directions: you always send as yourself, into either
-- your own thread or — if you're an admin — anyone's. sender_id = auth.uid()
-- is the part that matters, without it an admin could post a message
-- attributed to the person, or a person could forge one from AIM Now.
create policy messages_insert on messages
  for insert to authenticated
  with check (sender_id = auth.uid() and (person_id = auth.uid() or is_admin()));

-- No update policy at all: read_at moves only through mark_messages_read(),
-- and a sent message's body is final.
create policy messages_delete_admin on messages
  for delete to authenticated using (is_admin());

-- -----------------------------------------------------------------------------
-- Grants. RLS is the gate; these just make the tables reachable at all.
-- -----------------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, insert, update, delete on profiles, projects, assignments to authenticated;
-- No update: see messages_select above and mark_messages_read().
grant select, insert, delete on messages to authenticated;
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
