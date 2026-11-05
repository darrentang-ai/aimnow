-- =============================================================================
-- AIM Now Academy — progress tracking and assessments.
--
-- Run in the Supabase SQL editor AFTER supabase/schema.sql: this file leans on
-- profiles and on is_admin() from there.
--
-- Deliberately a second file rather than an addition to schema.sql. That one is
-- documented as "run once" and has already been run on the live project, so
-- appending to it would leave no way to tell what still needs applying. This
-- one is written to be re-runnable: every object is created if-not-exists or
-- replaced, and each policy is dropped before it is created.
-- =============================================================================

-- Courses are identified by a slug that lives in the front-end content files
-- (src/academy/content), not in a table. There is one course, its structure is
-- authored in code and version-controlled with the app, and a courses table
-- would only ever be a second copy of that going stale. The slug columns below
-- are the join between the two.

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

-- One row per lesson a learner has finished. Completion is a fact with a time,
-- so it is stored as a row that appears rather than a boolean that flips: the
-- row's existence is the completion, and un-completing is a delete. That also
-- makes "when did they do it" free, which a boolean column would not.
create table if not exists academy_lesson_progress (
  user_id    uuid not null references profiles(id) on delete cascade,
  course_id  text not null,
  -- "module-slug/lesson-slug", as built by lessonId() in src/academy/content.
  lesson_id  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id, lesson_id)
);

create index if not exists academy_lesson_progress_user_idx
  on academy_lesson_progress (user_id, course_id);

-- Every submitted attempt, kept rather than overwritten. A learner may retake a
-- quiz, and the history is the part worth having: a pass at the fourth attempt
-- is a different training record from a pass at the first, and an admin
-- reviewing competence should be able to see which it was.
--
-- Whether someone has passed is therefore derived — the best attempt per
-- assessment — never stored as a flag that could disagree with the rows under
-- it.
create table if not exists academy_quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  course_id     text not null,
  -- A module's slug for an end-of-module quiz, or 'final' for the assessment.
  assessment_id text not null,
  score         integer not null check (score >= 0),
  total         integer not null check (total > 0),
  -- The pass mark that applied when the attempt was taken, copied in rather
  -- than read from today's content. If the course is later made harder, an old
  -- pass stays a pass against the course the learner actually sat.
  pass_mark     integer not null check (pass_mark between 1 and 100),
  passed        boolean not null,
  -- { "question-id": chosen-option-index }. Kept so an attempt can be reviewed
  -- question by question, and so a retake can show what was missed last time.
  answers       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  constraint academy_quiz_attempts_score_fits check (score <= total)
);

create index if not exists academy_quiz_attempts_user_idx
  on academy_quiz_attempts (user_id, course_id, assessment_id, created_at desc);

-- In-lesson exercises: the drills inside a lesson, as opposed to the quiz that
-- closes a module. One row per learner per exercise, overwritten on a retry —
-- the opposite of academy_quiz_attempts, and deliberately so. These are
-- practice, not assessment: nothing is gated on them, so a history of attempts
-- would be a record nobody reads of someone learning in the normal way.
--
-- Inline knowledge checks are not stored at all. They are ungraded retrieval
-- practice, there are dozens of them, and a row per check would bury the two
-- exercises here that are actually worth looking at.
create table if not exists academy_exercise_responses (
  user_id     uuid not null references profiles(id) on delete cascade,
  course_id   text not null,
  -- Authored on the block in src/academy/content, e.g. 'm4-spotter'.
  exercise_id text not null,
  score       integer not null check (score >= 0),
  total       integer not null check (total > 0),
  -- The shape is the exercise's own business — which claims were flagged,
  -- which bucket each item went in. Stored so a learner can reopen what they
  -- did rather than only how many they got.
  response    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, course_id, exercise_id),
  constraint academy_exercise_score_fits check (score <= total)
);

-- Whether a learner has paid for their certificate. The course and the final
-- assessment are free; the certificate (and the public verification page behind
-- it) is what is charged for. One row per learner per course, not per attempt,
-- so a retake never charges twice and never needs a second payment recorded.
--
-- Payment is taken outside the app and an admin records it, so there is no
-- insert or update policy: the only way to write this table is
-- academy_set_certificate_paid() below, which checks is_admin().
create table if not exists academy_certificate_payments (
  user_id   uuid not null references profiles(id) on delete cascade,
  course_id text not null,
  paid_at   timestamptz not null default now(),
  marked_by uuid references profiles(id) on delete set null,
  primary key (user_id, course_id)
);

-- -----------------------------------------------------------------------------
-- Guards
-- -----------------------------------------------------------------------------

-- passed is what the certificate is read from, and the row is written by the
-- client, so taking it on trust would make the whole assessment decorative.
-- Recomputed here from the numbers in the same row. Those numbers are still
-- client-supplied — only marking on the server fixes that, and the answer key
-- ships in the bundle anyway — but at least the flag can no longer contradict
-- the score sitting beside it.
create or replace function academy_set_passed()
returns trigger
language plpgsql
as $fn$
begin
  new.passed := (new.score * 100) >= (new.pass_mark * new.total);
  return new;
end
$fn$;

drop trigger if exists academy_quiz_attempts_set_passed on academy_quiz_attempts;
create trigger academy_quiz_attempts_set_passed
  before insert or update on academy_quiz_attempts
  for each row execute function academy_set_passed();

-- -----------------------------------------------------------------------------
-- Reporting
--
-- security definer so an admin can read across learners without a policy that
-- opens every row to every authenticated user. Mirrors admin_list_people() in
-- schema.sql: returns nothing for a non-admin rather than raising, so a screen
-- that calls it speculatively degrades quietly.
-- -----------------------------------------------------------------------------

create or replace function academy_admin_overview(p_course_id text)
returns table (
  user_id            uuid,
  full_name          text,
  company            text,
  email              text,
  lessons_done       integer,
  attempts           integer,
  assessments_passed integer,
  final_passed       boolean,
  last_activity      timestamptz
)
language sql
security definer
stable
set search_path = public
as $fn$
  select p.id,
         p.full_name,
         p.company,
         u.email::text,
         (select count(*)::integer
            from academy_lesson_progress l
           where l.user_id = p.id and l.course_id = p_course_id),
         (select count(*)::integer
            from academy_quiz_attempts a
           where a.user_id = p.id and a.course_id = p_course_id),
         (select count(distinct a.assessment_id)::integer
            from academy_quiz_attempts a
           where a.user_id = p.id and a.course_id = p_course_id and a.passed),
         exists (select 1
                   from academy_quiz_attempts a
                  where a.user_id = p.id and a.course_id = p_course_id
                    and a.assessment_id = 'final' and a.passed),
         greatest(
           (select max(l.created_at) from academy_lesson_progress l
             where l.user_id = p.id and l.course_id = p_course_id),
           (select max(a.created_at) from academy_quiz_attempts a
             where a.user_id = p.id and a.course_id = p_course_id)
         )
    from profiles p
    join auth.users u on u.id = p.id
   where is_admin()
     and (exists (select 1 from academy_lesson_progress l
                   where l.user_id = p.id and l.course_id = p_course_id)
       or exists (select 1 from academy_quiz_attempts a
                   where a.user_id = p.id and a.course_id = p_course_id))
   order by 9 desc nulls last
$fn$;

-- The public face of a certificate: what /verify/:id reads, and what an admin
-- opens before approving one as a credential. Open to anon because a business
-- following the link from a project card may not be signed in.
--
-- Deliberately narrow, as it answers to anyone holding the link: the name that
-- is printed on the certificate and the facts about it, never an email or the
-- attempt history. The attempt id is a random uuid, and only its owner can read
-- it, so this cannot be used to walk through who has certified.
--
-- Counts rather than a verdict: the course's shape lives in the front end, so
-- VerifyCertificate.jsx is what compares them against it.
-- Dropped first because the columns it returns changed: create or replace
-- cannot alter a function's result type.
drop function if exists academy_verify_certificate(text, uuid);
create function academy_verify_certificate(p_course_id text, p_attempt_id uuid)
returns table (
  paid           boolean,
  full_name      text,
  score          integer,
  total          integer,
  awarded_at     timestamptz,
  lessons_done   integer,
  modules_passed integer
)
language sql
security definer
stable
set search_path = public
as $fn$
  with cert as (
    select a.*,
           exists (select 1 from academy_certificate_payments c
                    where c.user_id = a.user_id and c.course_id = a.course_id) as is_paid
      from academy_quiz_attempts a
     where a.id = p_attempt_id
       and a.course_id = p_course_id
       and a.assessment_id = 'final'
       and a.passed
  )
  -- Nothing but the paid flag until it is paid: an unpaid certificate has not
  -- been issued, so the person's name and score are not for a stranger holding
  -- the link to read.
  select a.is_paid,
         case when a.is_paid then p.full_name end,
         case when a.is_paid then a.score end,
         case when a.is_paid then a.total end,
         case when a.is_paid then a.created_at end,
         (select count(*)::integer
            from academy_lesson_progress l
           where l.user_id = a.user_id and l.course_id = a.course_id),
         (select count(distinct m.assessment_id)::integer
            from academy_quiz_attempts m
           where m.user_id = a.user_id and m.course_id = a.course_id
             and m.passed and m.assessment_id <> 'final')
    from cert a
    join profiles p on p.id = a.user_id
$fn$;

-- Record, or take back, that a learner has paid. Admin-only, and raises rather
-- than returning quietly: unlike the overview, a silent no-op here would look
-- like a payment had been recorded.
create or replace function academy_set_certificate_paid(p_user_id uuid, p_course_id text, p_paid boolean)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not is_admin() then
    raise exception 'Only an admin can record a payment';
  end if;
  if p_paid then
    insert into academy_certificate_payments (user_id, course_id, marked_by)
    values (p_user_id, p_course_id, auth.uid())
    on conflict (user_id, course_id) do nothing;
  else
    delete from academy_certificate_payments where user_id = p_user_id and course_id = p_course_id;
  end if;
end
$fn$;

-- -----------------------------------------------------------------------------
-- Row-level security
-- -----------------------------------------------------------------------------

alter table academy_lesson_progress   enable row level security;
alter table academy_quiz_attempts     enable row level security;
alter table academy_exercise_responses enable row level security;
alter table academy_certificate_payments enable row level security;

drop policy if exists academy_progress_select on academy_lesson_progress;
create policy academy_progress_select on academy_lesson_progress
  for select to authenticated
  using (user_id = auth.uid() or is_admin());

drop policy if exists academy_progress_insert_own on academy_lesson_progress;
create policy academy_progress_insert_own on academy_lesson_progress
  for insert to authenticated
  with check (user_id = auth.uid());

-- Marking a lesson unfinished again is the learner's own business; an admin can
-- clear a record too, which is how a reset is done.
drop policy if exists academy_progress_delete_own on academy_lesson_progress;
create policy academy_progress_delete_own on academy_lesson_progress
  for delete to authenticated
  using (user_id = auth.uid() or is_admin());

drop policy if exists academy_attempts_select on academy_quiz_attempts;
create policy academy_attempts_select on academy_quiz_attempts
  for select to authenticated
  using (user_id = auth.uid() or is_admin());

drop policy if exists academy_attempts_insert_own on academy_quiz_attempts;
create policy academy_attempts_insert_own on academy_quiz_attempts
  for insert to authenticated
  with check (user_id = auth.uid());

-- No update policy: an attempt records something that happened, and editing one
-- afterwards would defeat the point of keeping the history. Deletes are
-- admin-only for the same reason — a learner cannot quietly erase the three
-- failures before the pass.
drop policy if exists academy_attempts_delete_admin on academy_quiz_attempts;
create policy academy_attempts_delete_admin on academy_quiz_attempts
  for delete to authenticated
  using (is_admin());

drop policy if exists academy_payments_select on academy_certificate_payments;
create policy academy_payments_select on academy_certificate_payments
  for select to authenticated
  using (user_id = auth.uid() or is_admin());

drop policy if exists academy_exercises_select on academy_exercise_responses;
create policy academy_exercises_select on academy_exercise_responses
  for select to authenticated
  using (user_id = auth.uid() or is_admin());

-- Update as well as insert here, unlike attempts: redoing a drill replaces the
-- row, which is what makes it practice rather than a record.
drop policy if exists academy_exercises_write_own on academy_exercise_responses;
create policy academy_exercises_write_own on academy_exercise_responses
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists academy_exercises_update_own on academy_exercise_responses;
create policy academy_exercises_update_own on academy_exercise_responses
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists academy_exercises_delete_own on academy_exercise_responses;
create policy academy_exercises_delete_own on academy_exercise_responses
  for delete to authenticated
  using (user_id = auth.uid() or is_admin());

-- -----------------------------------------------------------------------------
-- Grants. RLS is the gate; these just make the tables reachable at all.
-- -----------------------------------------------------------------------------

grant select, insert, delete on academy_lesson_progress to authenticated;
grant select, insert, delete on academy_quiz_attempts to authenticated;
grant select, insert, update, delete on academy_exercise_responses to authenticated;
grant execute on function academy_admin_overview(text) to authenticated;
grant select on academy_certificate_payments to authenticated;
grant execute on function academy_set_certificate_paid(uuid, text, boolean) to authenticated;
grant execute on function academy_verify_certificate(text, uuid) to anon, authenticated;
