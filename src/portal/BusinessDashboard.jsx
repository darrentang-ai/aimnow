import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applyAsManager, atProjectLimit, loadProjects } from './data'
import MessagesSection from './MessagesSection'
import ProjectCard from './ProjectCard'
import { Alert, Empty, PageHead, UPGRADE_HREF } from './ui'

// The only route for a business who later decides they want to build rather
// than post. Without it the sign-in screen was the only place that mentioned
// becoming an AI Manager, and choosing it there did nothing for an account
// that already existed: signup metadata is read once, on insert.
function ApplyToBuild({ userId, onApplied }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const apply = async () => {
    setBusy(true)
    setError('')
    const { error } = await applyAsManager(userId)
    setBusy(false)
    if (error) setError(error.message)
    // Changes which dashboard this account gets, so the profile has to be
    // re-read rather than left until the next reload.
    else onApplied()
  }

  return (
    <section className="mt-12">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-display text-lg font-600 text-white">Want to build, rather than post?</h2>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">
          Apply to join our network of AI Managers. You'll be asked for two AI certificates, each with a
          link to the issuer's verification page, which we check ourselves before you can be matched
          with work.
        </p>
        <button
          onClick={apply}
          disabled={busy}
          className="btn-ghost mt-5 !py-2.5 !text-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Applying…' : 'Apply to become an AI Manager'}
        </button>
        {error && (
          <div className="mt-3">
            <Alert>{error}</Alert>
          </div>
        )}
      </div>
    </section>
  )
}

export default function BusinessDashboard({ userId, plan, onProfileChanged }) {
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
      <MessagesSection userId={userId} />
      <ApplyToBuild userId={userId} onApplied={onProfileChanged} />
    </>
  )
}
