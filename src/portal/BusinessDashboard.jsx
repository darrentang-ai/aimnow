import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { atProjectLimit, loadProjects } from './data'
import ProjectCard from './ProjectCard'
import { Alert, Empty, PageHead, UPGRADE_HREF } from './ui'

export default function BusinessDashboard({ userId, plan }) {
  const [projects, setProjects] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    loadProjects({ ownerId: userId }).then(({ projects, error }) => {
      if (cancelled) return
      if (error) setError(error.message)
      else setProjects(projects)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  // Until the projects load we don't know, and showing "Post a project" only
  // to swap it a moment later reads worse than showing nothing yet.
  const limitReached = projects !== null && atProjectLimit(plan, projects)

  return (
    <>
      <PageHead
        title="Your projects"
        sub="Post what you need and we'll assign a trusted AI Manager to deliver it with you."
        action={
          limitReached ? (
            <Link to={UPGRADE_HREF} className="btn-ghost !py-3">
              Upgrade to post another
            </Link>
          ) : (
            <Link to="/portal/new" className="btn-primary !py-3">
              Post a project
            </Link>
          )
        }
      />
      {error && <Alert>{error}</Alert>}
      {!error && projects === null && <p className="text-sm text-slate-400">Loading…</p>}
      {projects?.length === 0 && (
        <Empty>
          No projects yet.{' '}
          <Link to="/portal/new" className="font-semibold text-cyan-glow hover:underline">
            Post your first one
          </Link>{' '}
          and we'll take it from there.
        </Empty>
      )}
      {projects?.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </>
  )
}
