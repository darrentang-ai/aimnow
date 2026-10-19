import { supabase } from '../lib/supabase'

// Three plain queries joined in JS rather than one PostgREST embed. Embeds
// depend on generated foreign-key constraint names, and when a row-level
// policy filters something out an embed fails much less legibly than this.
export async function loadProjects({ ownerId } = {}) {
  let q = supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (ownerId) q = q.eq('owner_id', ownerId)

  const { data: projects, error } = await q
  if (error) return { error }
  if (!projects?.length) return { projects: [] }

  const { data: assignments, error: aErr } = await supabase
    .from('assignments')
    .select('project_id, manager_id, note, created_at')
    .eq('status', 'active')
    .in(
      'project_id',
      projects.map((p) => p.id)
    )
  if (aErr) return { error: aErr }

  const managerIds = [...new Set((assignments ?? []).map((a) => a.manager_id))]
  let managers = []
  if (managerIds.length) {
    const { data, error: mErr } = await supabase
      .from('profiles')
      .select('id, full_name, company, certificates')
      .in('id', managerIds)
    if (mErr) return { error: mErr }
    managers = data ?? []
  }

  // Skipped when `ownerId` is set — that's a business viewing its own
  // projects, which never shows the owner, so there's nothing to resolve.
  //
  // Best-effort otherwise: profiles_select only lets an admin (or the owner
  // themselves) read a business's profile — a manager fetching someone else's
  // owner row gets nothing back, not an error. admin_list_people() is the only
  // way at an email (it lives in auth.users, not profiles), and is itself
  // admin-gated, returning nothing for a manager rather than failing. Either
  // way, ProjectCard falls back to the raw id when a project has no matching
  // entry here, so a non-admin viewer degrades quietly rather than breaking.
  let owners = []
  let emailById = {}
  if (!ownerId) {
    const ownerIds = [...new Set(projects.map((p) => p.owner_id))]
    const [{ data: ownerData }, { data: people }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, company').in('id', ownerIds),
      supabase.rpc('admin_list_people'),
    ])
    owners = ownerData ?? []
    emailById = Object.fromEntries((people ?? []).map((p) => [p.id, p.email]))
  }

  const managerById = Object.fromEntries(managers.map((m) => [m.id, m]))
  const ownerById = Object.fromEntries(owners.map((o) => [o.id, { ...o, email: emailById[o.id] }]))
  const byProject = Object.fromEntries(
    (assignments ?? []).map((a) => [a.project_id, { ...a, manager: managerById[a.manager_id] ?? null }])
  )

  return {
    projects: projects.map((p) => ({
      ...p,
      assignment: byProject[p.id] ?? null,
      owner: ownerById[p.owner_id] ?? null,
    })),
  }
}

// How many projects a plan may have open at once. Mirrors
// enforce_project_limit() in supabase/schema.sql, which is what actually stops
// the insert — this copy exists so the screen can offer the upgrade instead of
// letting someone fill in a form that is going to be refused.
const PROJECT_LIMITS = { free: 1 }

// Undefined means no limit. Cancelled projects don't count, matching the
// trigger — cancelling one gives the slot back.
export function projectLimitFor(plan) {
  return PROJECT_LIMITS[plan ?? 'free']
}

export function countsTowardLimit(projects) {
  return (projects ?? []).filter((p) => p.status !== 'cancelled').length
}

export function atProjectLimit(plan, projects) {
  const limit = projectLimitFor(plan)
  return limit !== undefined && countsTowardLimit(projects) >= limit
}

// The trigger raises PROJECT_LIMIT_REACHED rather than a sentence, so the
// wording lives here with the rest of the copy. Anything else is passed
// through as-is.
export function describeInsertError(error) {
  if (!error) return ''
  return error.message?.includes('PROJECT_LIMIT_REACHED')
    ? 'The free plan covers one project. Upgrade to post another.'
    : error.message
}

// Certificates come along so the picker can show who is actually assignable —
// assign_project() rejects anyone under the minimum, and finding that out by
// hitting the error is a poor way to learn it.
export const MIN_CERTIFICATES = 2

export async function loadManagers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, company, certificates')
    .eq('role', 'manager')
    .order('full_name')
  return { managers: data ?? [], error }
}

// Only approved certificates count — see assign_project(), which enforces it.
export function eligibleToAssign(manager) {
  return approvedCount(manager?.certificates) >= MIN_CERTIFICATES
}

// Wraps the security-definer function, so the assignment row and the project
// status move together instead of as two round trips.
export async function assignProject({ projectId, managerId, note }) {
  return supabase.rpc('assign_project', {
    p_project_id: projectId,
    p_manager_id: managerId,
    p_note: note ?? null,
  })
}

export async function setProjectStatus(projectId, status) {
  return supabase.from('projects').update({ status }).eq('id', projectId)
}

// Irreversible: there is no soft-delete column, and the project's assignments
// go with it via `on delete cascade`. Cancelling is the reversible option.
export async function deleteProject(projectId) {
  // Ask for the deleted row back. A delete refused by row-level security
  // reports no error at all — it simply affects nothing — so the returned rows
  // are the only way to tell success from a silent permission failure.
  const { data, error } = await supabase.from('projects').delete().eq('id', projectId).select('id')
  if (error) return { error }
  if (!data?.length) {
    return { error: { message: 'Nothing was deleted. Check you are still signed in as an admin.' } }
  }
  return {}
}

// Email is only reachable through admin_list_people(), because it lives in
// auth.users rather than profiles. Falls back to the plain profiles query when
// that function doesn't exist yet, so the People section still works on a
// deployment that has run ahead of the migration — just without emails.
export async function loadPeople() {
  const viaRpc = await supabase.rpc('admin_list_people')
  if (!viaRpc.error) {
    // The function returns {id, email, profile} so that adding a profile column
    // doesn't change its return type. Flatten it here, and callers carry on
    // seeing one plain object per person.
    return { people: (viaRpc.data ?? []).map(({ id, email, profile }) => ({ ...profile, id, email })) }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, company, created_at')
    .order('created_at', { ascending: false })
  return { people: data ?? [], error }
}

export async function setProfileRole(profileId, role) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profileId)
    .select('id, role')
  if (error) return { error }
  // guard_role_change() raises, which surfaces as an error above — but a plain
  // row-level-security refusal returns no error and no rows, so check both.
  if (!data?.length) {
    return { error: { message: 'Role was not changed. Check you are still signed in as an admin.' } }
  }
  return {}
}

// A business putting itself forward to build instead. No RPC needed: the
// profiles_update_own policy already allows writing your own row, and
// guard_role_change() permits exactly this one transition — see schema.sql.
//
// The `role = 'business'` filter is what makes a second click a no-op rather
// than a reset, and signup_as is deliberately left alone: it records what they
// chose when they joined, which is still true.
export async function applyAsManager(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'applicant' })
    .eq('id', userId)
    .eq('role', 'business')
    .select('id')
  if (error) return { error }
  if (!data?.length) {
    return { error: { message: 'Nothing changed — your account may already be an application.' } }
  }
  return {}
}

// What deleting someone would destroy. Null comes back for a non-admin, which
// is why the caller treats null as a refusal rather than as "nothing attached".
export async function loadPersonImpact(personId) {
  const { data, error } = await supabase.rpc('admin_person_impact', { p_person_id: personId })
  if (error) return { error }
  if (!data) return { error: { message: 'Only an admin can see this.' } }
  return { impact: data }
}

// Deletes the auth.users row, which cascades to the profile and everything
// hanging off it — see admin_delete_person() in schema.sql for what goes.
// Irreversible, and it does not stop the same address signing up again.
export async function deletePerson(personId) {
  const { error } = await supabase.rpc('admin_delete_person', { p_person_id: personId })
  return error ? { error } : {}
}

// Upgrading is a sales conversation rather than a checkout, so a plan is
// granted here after it is agreed. guard_plan_change() refuses anyone else.
export async function setProfilePlan(profileId, plan) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ plan })
    .eq('id', profileId)
    .select('id, plan')
  if (error) return { error }
  if (!data?.length) {
    return { error: { message: 'Plan was not changed. Check you are still signed in as an admin.' } }
  }
  return {}
}

export const PLANS = ['free', 'premium', 'enterprise']

// The top tier is called Ultimate on the site but is still stored as
// 'enterprise': the value is in a check constraint, in every existing row,
// and in nothing a customer sees. Renaming it would be a migration bought for
// nothing, so the label is mapped here instead — the admin dropdown reads the
// same word the pricing card does.
export const PLAN_LABELS = { free: 'free', premium: 'premium', enterprise: 'ultimate' }

// Messages -------------------------------------------------------------------
//
// A thread is just a person_id — see the messages table in schema.sql. The
// person sees their own thread; an admin sees anyone's.

export async function loadMessages(personId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, from_admin, body, read_at, created_at')
    .eq('person_id', personId)
    .order('created_at')
  return { messages: data ?? [], error }
}

export async function sendMessage({ personId, senderId, body }) {
  const trimmed = body.trim()
  if (!trimmed) return { error: { message: 'Write a message first.' } }

  const { data, error } = await supabase
    .from('messages')
    .insert({ person_id: personId, sender_id: senderId, body: trimmed })
    .select('id, sender_id, from_admin, body, read_at, created_at')
  if (error) return { error }
  // messages_insert refuses a forged sender with no error and no rows.
  if (!data?.length) {
    return { error: { message: 'Nothing was sent. Check you are still signed in.' } }
  }
  return { message: data[0] }
}

// Clears whichever direction the caller is the recipient of — the function
// works that out from auth.uid(), so there's nothing to pass but the thread.
export async function markMessagesRead(personId) {
  return supabase.rpc('mark_messages_read', { p_person_id: personId })
}

// Admin-only, per messages_delete_admin. Deletes the whole thread for both
// sides at once — there is no per-person copy of a message, so this removes it
// from the person's dashboard too.
export async function deleteConversation(personId) {
  // Ask for the deleted ids back. A delete refused by row-level security
  // reports no error at all — it simply affects nothing — so the returned rows
  // are the only way to tell success from a silent permission failure.
  const { data, error } = await supabase
    .from('messages')
    .delete()
    .eq('person_id', personId)
    .select('id')
  if (error) return { error }
  if (!data?.length) {
    return { error: { message: 'Nothing was deleted. Check you are still signed in as an admin.' } }
  }
  return { deleted: data.length }
}

// For the person's own badge: how many unanswered messages AIM Now has sent.
export async function countUnreadForPerson(personId) {
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('person_id', personId)
    .eq('from_admin', true)
    .is('read_at', null)
  return { unread: count ?? 0, error }
}

// For the admin list: which people are waiting on a reply. Only ids come back,
// never bodies — this feeds a dot on a row, and the thread is loaded on open.
export async function loadUnreadByPerson() {
  const { data, error } = await supabase
    .from('messages')
    .select('person_id')
    .eq('from_admin', false)
    .is('read_at', null)
  if (error) return { unreadByPerson: {}, error }

  const unreadByPerson = {}
  for (const { person_id: id } of data ?? []) {
    unreadByPerson[id] = (unreadByPerson[id] ?? 0) + 1
  }
  return { unreadByPerson }
}

export async function loadAchievements(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('certificates, personal_projects')
    .eq('id', userId)
    .maybeSingle()
  return {
    certificates: data?.certificates ?? [],
    personalProjects: data?.personal_projects ?? [],
    error,
  }
}

async function saveOwnProfile(userId, patch) {
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select('id')
  if (error) return { error }
  // profiles_update_own refuses someone else's row with no error and no rows.
  if (!data?.length) {
    return { error: { message: 'Nothing was saved. Check you are still signed in.' } }
  }
  return {}
}

export const saveCertificates = (userId, certificates) => saveOwnProfile(userId, { certificates })

export const savePersonalProjects = (userId, personalProjects) =>
  saveOwnProfile(userId, { personal_projects: personalProjects })

// Server-side so the admin check can't be skipped, and so the read-modify-write
// happens in one statement rather than racing another tab.
export async function setCertificateApproval(profileId, url, approved) {
  return supabase.rpc('set_certificate_approval', {
    p_profile_id: profileId,
    p_url: url,
    p_approved: approved,
  })
}

export function approvedCount(certificates) {
  return (certificates ?? []).filter((c) => c.approved === true).length
}

// Written out rather than left to toLocaleString, which asks the browser to
// decide and so rendered one timestamp two ways: an admin reading "Oct 19,
// 04:02 PM" in the People list while the person it was sent to saw "19 Oct,
// 16:02" — the same message, apparently at different times.
//
// Pinning a locale wasn't enough. Every day-first English locale abbreviates
// September as "Sept" in some ICU builds and "Sep" in others, and browsers
// ship their own, so the two sides could still disagree. This is the only way
// the format is the same everywhere.
//
// The clock stays local to whoever is reading: two people in different
// timezones should see their own time for the same message, which is why
// these use the local getters rather than the UTC ones.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad = (n) => String(n).padStart(2, '0')

export function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// 24-hour, so there is no AM/PM to read differently on either side.
export function formatDateTime(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function managerLabel(manager) {
  if (!manager) return 'Unassigned'
  return manager.company ? `${manager.full_name ?? 'AI Manager'} · ${manager.company}` : manager.full_name ?? 'AI Manager'
}

// `owner` is null both when a project genuinely has no profile (shouldn't
// happen) and when RLS silently withheld it from a non-admin viewer — see the
// comment in loadProjects(). Either way, falling back to the id is better
// than showing nothing.
export function ownerLabel(owner, ownerId) {
  if (!owner) return `${ownerId.slice(0, 8)}…`
  const name = owner.full_name || `${ownerId.slice(0, 8)}…`
  return owner.company ? `${name} · ${owner.company}` : name
}
