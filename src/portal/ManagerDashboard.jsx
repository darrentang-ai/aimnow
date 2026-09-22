import { useCallback, useEffect, useState } from 'react'
import { describeAccepted, verifierFor } from './certificates'
import { loadCertificates, loadProjects, saveCertificates } from './data'
import ProjectCard from './ProjectCard'
import { Alert, Empty, PageHead } from './ui'

// Credentials an AI Manager reports about themselves, alongside one number
// they can't: projects actually delivered through the Portal.
function Merits({ userId, completedCount }) {
  const [certificates, setCertificates] = useState(null)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const { certificates, error } = await loadCertificates(userId)
    if (error) setError(error.message)
    else setCertificates(certificates)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const persist = async (next) => {
    setBusy(true)
    setError('')
    const { error } = await saveCertificates(userId, next)
    setBusy(false)
    if (error) {
      setError(error.message)
      return false
    }
    setCertificates(next)
    return true
  }

  const add = async (e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()
    setError('')

    if (!trimmedName || !trimmedUrl) return
    if (!verifierFor(trimmedUrl)) {
      setError(`That isn't a verification link we recognise. Accepted issuers: ${describeAccepted()}.`)
      return
    }
    // Say so rather than no-op — a dead button reads as a bug.
    if (certificates.some((c) => c.url === trimmedUrl)) {
      setError('That certificate is already listed.')
      return
    }

    if (await persist([...certificates, { name: trimmedName, url: trimmedUrl }])) {
      setName('')
      setUrl('')
    }
  }

  const remove = (target) => persist(certificates.filter((c) => c.url !== target.url))

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-glow">Your merits</h2>
      <div className="card">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-700 text-white">{completedCount}</span>
          <span className="text-sm text-slate-400">
            {completedCount === 1 ? 'project' : 'projects'} delivered through the Portal
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Counted from completed projects, not self-reported — so it stands on its own.
        </p>

        <div className="mt-6 border-t border-white/10 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Certificates</h3>
          {certificates === null ? (
            <p className="mt-3 text-sm text-slate-400">Loading…</p>
          ) : (
            <>
              {certificates.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  None added yet. Each one needs a verification link, so a business can check it rather
                  than take your word for it.
                </p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {certificates.map((c) => (
                    <li
                      key={c.url}
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-glow/30 bg-cyan-glow/10 px-3 py-1.5 text-xs font-semibold text-cyan-glow"
                    >
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {c.name}
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                          <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                      <button
                        onClick={() => remove(c)}
                        disabled={busy}
                        aria-label={`Remove ${c.name}`}
                        className="text-cyan-glow/60 transition-colors hover:text-white disabled:opacity-50"
                      >
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={add} className="mt-4 space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input !py-2 !text-xs"
                  placeholder="Certificate name, e.g. Generative AI Leader"
                />
                <div className="flex flex-wrap gap-2">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="input !w-auto min-w-[14rem] flex-1 !py-2 !text-xs"
                    placeholder="https://verify.skilljar.com/c/…"
                  />
                  <button
                    type="submit"
                    disabled={busy || !name.trim() || !url.trim()}
                    className="btn-ghost !px-5 !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? 'Saving…' : 'Add'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Verification links only, from: {describeAccepted()}.
                </p>
              </form>
            </>
          )}
          {error && (
            <div className="mt-3">
              <Alert>{error}</Alert>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function ManagerDashboard({ userId }) {
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

  const completedCount = (projects ?? []).filter((p) => p.status === 'completed').length

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

      {/* Only once the project list has loaded, so the count isn't briefly 0. */}
      {projects !== null && <Merits userId={userId} completedCount={completedCount} />}
    </>
  )
}
