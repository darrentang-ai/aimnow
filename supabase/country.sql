-- =============================================================================
-- Country on a person's profile.
--
-- Run in the Supabase SQL editor AFTER supabase/schema.sql. Re-runnable. A fresh
-- install runs schema.sql, then this.
--
-- Why a table of its own rather than a column on profiles: profiles_select lets
-- every signed-in user read every AI Manager's row, and a business must not see
-- where a manager is. A column on that table would be readable through the API
-- whatever the screens choose to select, so the privacy would live in front-end
-- code. Here the policies are the privacy: a person reads and writes their own
-- row, an admin reads everyone's, and nobody else can see the table at all.
-- =============================================================================

create table if not exists profile_private (
  user_id uuid primary key references profiles(id) on delete cascade,
  -- ISO 3166-1 alpha-2, e.g. 'GB'. A code rather than a name so that reports
  -- and filters do not have to reconcile "UK", "United Kingdom" and "england".
  country text check (country ~ '^[A-Z]{2}$')
);

alter table profile_private enable row level security;

drop policy if exists profile_private_select on profile_private;
create policy profile_private_select on profile_private
  for select to authenticated
  using (user_id = auth.uid() or is_admin());

drop policy if exists profile_private_insert_own on profile_private;
create policy profile_private_insert_own on profile_private
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists profile_private_update_own on profile_private;
create policy profile_private_update_own on profile_private
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on profile_private to authenticated;

-- Sign-up. Same as schema.sql with the country added. A missing or malformed
-- country is stored as nothing rather than rejected: the form requires it, but
-- a trigger that raised here would turn a bad value into a failed sign-up with
-- no account and no explanation, and a blank can be filled in from the portal.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wants_manager boolean := new.raw_user_meta_data->>'signup_as' = 'manager';
  v_country text := upper(nullif(btrim(new.raw_user_meta_data->>'country'), ''));
begin
  insert into profiles (id, full_name, company, signup_as, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'company', ''),
    case when v_wants_manager then 'manager' else 'business' end,
    case when v_wants_manager then 'applicant' else 'business' end::user_role
  );
  if v_country ~ '^[A-Z]{2}$' then
    insert into profile_private (user_id, country) values (new.id, v_country);
  end if;
  return new;
end
$$;

-- The admin's People list. Same result shape as before — the profile is still
-- one jsonb value — with the country merged into it, so the screen needs no
-- second query and the function stays admin-only.
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
  select p.id, u.email::text, to_jsonb(p) || jsonb_build_object('country', pp.country)
    from profiles p
    join auth.users u on u.id = p.id
    left join profile_private pp on pp.user_id = p.id
   where is_admin()
   order by p.created_at desc
$$;
