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
      .select('id, full_name, company')
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

export async function loadManagers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, company')
    .eq('role', 'manager')
    .order('full_name')
  return { managers: data ?? [], error }
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

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function managerLabel(manager) {
  if (!manager) return 'Unassigned'
  return manager.company ? `${manager.full_name ?? 'AI Manager'} · ${manager.company}` : manager.full_name ?? 'AI Manager'
}
