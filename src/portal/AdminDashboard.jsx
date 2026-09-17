import { useCallback, useEffect, useState } from 'react'
import { assignProject, loadManagers, loadProjects, setProjectStatus } from './data'
import ProjectCard from './ProjectCard'
import { Alert, Empty, PageHead } from './ui'

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
      {error && <Alert>{error}</Alert>}
    </div>
  )
}

export default function AdminDashboard() {
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
    </>
  )
}
