-- Correcting a mistyped email address from the People tab.
--
-- Re-runnable. Run it in the Supabase SQL editor; nothing else depends on it.
--
-- The address lives in auth.users (and auth.identities, which sign-in checks),
-- neither of which the app can write to, so the change goes through a function.
--
-- Only an address that was NEVER confirmed can be changed. Someone who has
-- followed a sign-in link to it has proved it is theirs; letting an admin swap
-- it out from under them would be an account takeover with extra steps. An
-- unconfirmed one may belong to no-one, which is the case this is for.
--
-- The new address is also left unconfirmed, so the person confirms it by
-- signing in with it. Whoever owns the new address can sign in to the account,
-- so the screen asks for it to be checked with the person first.

create or replace function admin_change_email(p_person_id uuid, p_new_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_new_email, '')));
begin
  if not is_admin() then
    raise exception 'Only an admin can change an email address';
  end if;

  if p_person_id = auth.uid() then
    raise exception 'You cannot change your own email address here';
  end if;

  if v_email !~ '^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$' then
    raise exception 'That is not a valid email address';
  end if;

  if not exists (
    select 1 from auth.users where id = p_person_id and email_confirmed_at is null
  ) then
    raise exception
      'Only an address that was never confirmed can be changed here. This person has signed in with theirs, so it is theirs to change.';
  end if;

  if exists (select 1 from auth.users where lower(email) = v_email and id <> p_person_id) then
    raise exception 'Another account already uses that address';
  end if;

  update auth.users
     set email = v_email,
         updated_at = now()
   where id = p_person_id;

  update auth.identities
     set identity_data = jsonb_set(identity_data, '{email}', to_jsonb(v_email)),
         provider_id = v_email,
         updated_at = now()
   where user_id = p_person_id
     and provider = 'email';
end
$$;

revoke execute on function admin_change_email(uuid, text) from anon;
grant execute on function admin_change_email(uuid, text) to authenticated;
