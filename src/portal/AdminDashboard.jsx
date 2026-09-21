import { useCallback, useEffect, useState } from 'react'
import {
  assignProject,
  deleteProject,
  formatDate,
  loadManagers,
  loadPeople,
  loadProjects,
  setProfileRole,
  setProjectStatus,
} from './data'
import ProjectCard from './ProjectCard'
import { Alert, Empty, PageHead } from './ui'

const ROLES = ['business', 'manager', 'admin']
const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000

const NEXT_STATUS = {
  assigned: [['in_progress', 'Mark in progress'], ['cancelled', 'Cancel']],
  in_progress: [['completed', 'Mark completed'], ['cancelled', 'Cancel']],
  open: [['cancelled', 'Cancel']],
}

function AssignControls({ project, managers, onDone }) {
  const [managerId, setManagerId] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const run = async (fn) => {
    setBusy(true)
    setError('')
    const { error } = await fn()
    setBusy(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
          className="input !w-auto min-w-[12rem] flex-1 !py-2 !text-xs"
        >
          <option value="" className="bg-ink-800">
            {project.assignment ? 'Reassign to…' : 'Assign to…'}
          </option>
          {managers.map((m) => (
            <option key={m.id} value={m.id} className="bg-ink-800">
              {m.full_name ?? m.id.slice(0, 8)}
              {m.company ? ` · ${m.company}` : ''}
            </option>
          ))}
        </select>
        <button
          disabled={!managerId || busy}
          onClick={() => run(() => assignProject({ projectId: project.id, managerId, note }))}
          className="btn-primary !px-5 !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Saving…' : project.assignment ? 'Reassign' : 'Assign'}
        </button>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="input !py-2 !text-xs"
        placeholder="Note for the manager (optional)"
      />
      <div className="flex flex-wrap gap-2">
        {(NEXT_STATUS[project.status] ?? []).map(([status, label]) => (
          <button
            key={status}
            disabled={busy}
            onClick={() => run(() => setProjectStatus(project.id, status))}
            className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-glow/50 hover:text-cyan-glow disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Deliberately the quietest control here: Cancel keeps the record and is
          the right action for a real project, so it stays the obvious one.
          Two-step rather than window.confirm, which some embedded browsers
          suppress outright — a suppressed dialog would delete without asking. */}
      <div className="border-t border-white/10 pt-3">
        {confirmingDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Delete permanently? This cannot be undone.</span>
            <button
              disabled={busy}
              onClick={() => run(() => deleteProject(project.id))}
              className="rounded-full border border-red-400/40 bg-red-400/10 px-3.5 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-400/20 disabled:opacity-50"
            >
              {busy ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-glow"
            >
              Keep it
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-xs font-semibold text-slate-500 transition-colors hover:text-red-300"
          >
            Delete project
          </button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}
    </div>
  )
}

function PersonRow({ person, isSelf, onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isNew = Date.now() - new Date(person.created_at).getTime() < NEW_FOR_MS

  const change = async (role) => {
    setBusy(true)
    setError('')
    const { error } = await setProfileRole(person.id, role)
    setBusy(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="truncate">{person.full_name || 'No name given'}</span>
          {isNew && (
            <span className="shrink-0 rounded-full border border-cyan-glow/30 bg-cyan-glow/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-glow">
              New
            </span>
          )}
        </p>
        <p className="truncate text-xs text-slate-500">
          {person.company || '—'} · joined {formatDate(person.created_at)}
        </p>
      </div>

      {/* Changing your own role here would drop your admin rights with no way
          back in the UI, so your own row is read-only. */}
      {isSelf ? (
        <span className="text-xs font-semibold text-slate-400">{person.role} · you</span>
      ) : (
        <select
          value={person.role}
          disabled={busy}
          onChange={(e) => change(e.target.value)}
          className="input !w-auto !py-1.5 !text-xs disabled:opacity-50"
        >
          {ROLES.map((r) => (
            <option key={r} value={r} className="bg-ink-800">
              {r}
            </option>
          ))}
        </select>
      )}

      {error && (
        <div className="w-full">
          <Alert>{error}</Alert>
        </div>
      )}
    </li>
  )
}

// Answers "has anyone signed up?" without a trip to the SQL editor, and makes
// promoting an AI Manager a UI action rather than a hand-written UPDATE.
function People({ currentUserId }) {
  const [people, setPeople] = useState(null)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const { people, error } = await loadPeople()
    if (error) setError(error.message)
    else setPeople(people)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const newCount = (people ?? []).filter(
    (p) => Date.now() - new Date(p.created_at).getTime() < NEW_FOR_MS
  ).length

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-glow">
        People <span className="text-slate-500">({people?.length ?? 0})</span>
        {newCount > 0 && <span className="ml-2 normal-case tracking-normal text-slate-400">{newCount} new this week</span>}
      </h2>
      {error && <Alert>{error}</Alert>}
      {!error && people === null && <p className="text-sm text-slate-400">Loading…</p>}
      {people?.length === 0 && <Empty>Nobody has signed up yet.</Empty>}
      {people?.length > 0 && (
        <div className="card">
          <ul>
            {people.map((p) => (
              <PersonRow key={p.id} person={p} isSelf={p.id === currentUserId} onDone={refresh} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export default function AdminDashboard({ userId }) {
  const [projects, setProjects] = useState(null)
  const [managers, setManagers] = useState([])
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const [{ projects, error }, { managers, error: mErr }] = await Promise.all([loadProjects(), loadManagers()])
    if (error || mErr) setError((error ?? mErr).message)
    else {
      setProjects(projects)
      setManagers(managers)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const open = projects?.filter((p) => p.status === 'open') ?? []
  const live = projects?.filter((p) => ['assigned', 'in_progress'].includes(p.status)) ?? []
  const closed = projects?.filter((p) => ['completed', 'cancelled'].includes(p.status)) ?? []

  return (
    <>
      <PageHead
        title="All projects"
        sub="Review what businesses have posted and assign a trusted AI Manager."
      />
      {error && <Alert>{error}</Alert>}
      {!error && projects === null && <p className="text-sm text-slate-400">Loading…</p>}

      {managers.length === 0 && projects !== null && (
        <div className="mb-8">
          <Alert kind="info">
            No AI Managers yet. Have one sign in once, then run:{' '}
            <code className="text-xs">
              update profiles set role = 'manager' where id = (select id from auth.users where email = '…');
            </code>
          </Alert>
        </div>
      )}

      {projects !== null &&
        [
          ['Awaiting assignment', open],
          ['Live', live],
          ['Closed', closed],
        ].map(([label, list]) => (
          <section key={label} className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-glow">
              {label} <span className="text-slate-500">({list.length})</span>
            </h2>
            {list.length === 0 ? (
              <Empty>Nothing here.</Empty>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {list.map((p) => (
                  <ProjectCard key={p.id} project={p} showOwner>
                    <AssignControls project={p} managers={managers} onDone={refresh} />
                  </ProjectCard>
                ))}
              </div>
            )}
          </section>
        ))}

      {/* After the project queue: assigning work is the job, seeing who signed
          up is the check-in. */}
      <People currentUserId={userId} />
    </>
  )
}
