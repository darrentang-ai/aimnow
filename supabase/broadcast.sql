-- =============================================================================
-- Broadcast — one message into every member's thread.
--
-- Run in the Supabase SQL editor AFTER supabase/schema.sql: it leans on
-- messages, profiles and is_admin() from there. Re-runnable.
-- =============================================================================

-- Why a function rather than the client inserting a row per person:
--
--   * It is one statement in one transaction. A loop in the browser that fails
--     at person 40 leaves half an announcement sent and no way to tell which
--     half without reading the table.
--   * The admin check belongs on the server. messages_insert already requires
--     sender_id = auth.uid(), but it lets any signed-in user write into their
--     own thread — nothing in the policies stops a non-admin from trying to
--     fan out, and nothing should depend on the screen not offering it.
--   * The recipient set is decided here, from roles, rather than from a list
--     of ids the client assembled and could get wrong.
--
-- security definer to read profiles without tripping its policies, in the same
-- way as the helpers in schema.sql. It is deliberately NOT usable from the SQL
-- editor: auth.uid() is null there, so is_admin() is false and the first check
-- raises. A broadcast should carry the name of whoever sent it.
create or replace function broadcast_message(p_body text, p_audience text default 'all')
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_sender uuid := auth.uid();
  v_body   text := btrim(p_body);
  v_count  integer;
begin
  if not is_admin() then
    raise exception 'Only an admin can send a broadcast';
  end if;

  if coalesce(v_body, '') = '' then
    raise exception 'A broadcast needs a message';
  end if;

  -- Long enough for an announcement, short enough that nobody pastes a
  -- newsletter into eighty threads.
  if length(v_body) > 2000 then
    raise exception 'A broadcast is limited to 2000 characters';
  end if;

  if p_audience not in ('all', 'business', 'manager', 'applicant') then
    raise exception 'Unknown audience: %', p_audience;
  end if;

  -- Admins are never recipients: they are the ones sending, and a thread with
  -- yourself is what from_admin would have to be wrong to allow.
  insert into messages (person_id, sender_id, body)
  select p.id, v_sender, v_body
    from profiles p
   where p.role <> 'admin'
     and (p_audience = 'all' or p.role::text = p_audience);

  get diagnostics v_count = row_count;
  return v_count;
end
$fn$;

grant execute on function broadcast_message(text, text) to authenticated;
