import { useCallback, useEffect, useState } from 'react'
import { describeAccepted, urlLooksLikeCredential, verifierFor } from './certificates'
import { loadMerits, loadProjects, saveCertificates, savePersonalProjects } from './data'
import ProjectCard from './ProjectCard'
import { Alert, Empty, PageHead } from './ui'

// Credentials an AI Manager reports about themselves, alongside one number
// they can't: projects actually delivered through the Portal.
function Merits({ userId, completedCount }) {
  const [certificates, setCertificates] = useState(null)
  const [personalProjects, setPersonalProjects] = useState([])
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const { certificates, personalProjects, error } = await loadMerits(userId)
    if (error) setError(error.message)
    else {
      setCertificates(certificates)
      setPersonalProjects(personalProjects)
    }
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
    if (!urlLooksLikeCredential(trimmedUrl)) {
      setError("That link is on the right site but doesn't point at a certificate. Paste the full verification URL.")
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
                      title={c.approved ? 'Approved by AIM Now' : 'Waiting for AIM Now to check the link'}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        c.approved
                          ? 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow'
                          : 'border-white/15 bg-white/5 text-slate-400'
                      }`}
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
                      {!c.approved && <span className="text-[10px] uppercase tracking-wide text-slate-500">pending</span>}
                      <button
                        onClick={() => remove(c)}
                        disabled={busy}
                        aria-label={`Remove ${c.name}`}
                        className="opacity-60 transition-opacity hover:opacity-100 disabled:opacity-40"
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
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Verification links only, from: {describeAccepted()}. AIM Now checks each link before
                  it counts — you need two approved to be assigned work.
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

        <PersonalProjects
          userId={userId}
          items={personalProjects}
          onSaved={setPersonalProjects}
        />
      </div>
    </section>
  )
}

// Work done outside the Portal. Self-reported by definition — there is nothing
// to derive it from — so it is labelled that way and kept clear of the counted
// number above, which is the one that carries weight.
function PersonalProjects({ userId, items, onSaved }) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const persist = async (next) => {
    setBusy(true)
    setError('')
    const { error } = await savePersonalProjects(userId, next)
    setBusy(false)
    if (error) {
      setError(error.message)
      return false
    }
    onSaved(next)
    return true
  }

  const add = async (e) => {
    e.preventDefault()
    setError('')
    const entry = { title: title.trim(), summary: summary.trim(), url: url.trim() }
    if (!entry.title) return
    if (entry.url && !/^https:\/\//i.test(entry.url)) {
      setError('A link has to start with https://')
      return
    }
    if (await persist([...items, entry])) {
      setTitle('')
      setSummary('')
      setUrl('')
    }
  }

  const remove = (target) => persist(items.filter((p) => p !== target))

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Personal projects</h3>
      <p className="mt-1 text-xs text-slate-500">
        Work you've delivered outside the Portal. Self-reported, and shown as such.
      </p>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Nothing added yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((p, i) => (
            <li key={`${p.title}-${i}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{p.title}</p>
                <button
                  onClick={() => remove(p)}
                  disabled={busy}
                  className="text-xs font-semibold text-slate-500 transition-colors hover:text-red-300 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
              {p.summary && <p className="mt-1 text-xs leading-relaxed text-slate-400">{p.summary}</p>}
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-300 transition-colors hover:text-cyan-glow"
                >
                  {p.url.replace(/^https:\/\//, '')}
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                    <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-4 space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input !py-2 !text-xs"
          placeholder="Project title, e.g. Data extraction tool for a recruiter"
        />
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className="input resize-none !py-2 !text-xs"
          placeholder="What you built and what it changed (optional)"
        />
        <div className="flex flex-wrap gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input !w-auto min-w-[14rem] flex-1 !py-2 !text-xs"
            placeholder="https://… (optional)"
          />
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="btn-ghost !px-5 !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Add'}
          </button>
        </div>
      </form>
      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
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
