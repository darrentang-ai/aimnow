import { useEffect, useState } from 'react'
import { loadProjects } from './data'
import ProjectCard from './ProjectCard'
import { Alert, Empty, PageHead } from './ui'

export default function ManagerDashboard() {
  const [projects, setProjects] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    // No owner filter: the projects_select policy already narrows this to
    // projects with an active assignment to the signed-in manager.
    loadProjects().then(({ projects, error }) => {
      if (cancelled) return
      if (error) setError(error.message)
      else setProjects(projects)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <PageHead title="Assigned to you" sub="Projects AIM Now has matched you with." />
      {error && <Alert>{error}</Alert>}
      {!error && projects === null && <p className="text-sm text-slate-400">Loading…</p>}
      {/* No notification exists, so don't promise one — a manager who trusts
          this would simply never come back. */}
      {projects?.length === 0 && <Empty>Nothing assigned yet. Anything matched to you will appear here.</Empty>}
      {projects?.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} showOwner />
          ))}
        </div>
      )}
    </>
  )
}
