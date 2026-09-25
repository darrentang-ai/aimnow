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

  const managerById = Object.fromEntries(managers.map((m) => [m.id, m]))
  const byProject = Object.fromEntries(
    (assignments ?? []).map((a) => [a.project_id, { ...a, manager: managerById[a.manager_id] ?? null }])
  )

  return { projects: projects.map((p) => ({ ...p, assignment: byProject[p.id] ?? null })) }
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

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function managerLabel(manager) {
  if (!manager) return 'Unassigned'
  return manager.company ? `${manager.full_name ?? 'AI Manager'} · ${manager.company}` : manager.full_name ?? 'AI Manager'
}
