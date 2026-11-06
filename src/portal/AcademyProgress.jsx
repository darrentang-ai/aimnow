import { useEffect, useMemo, useState } from 'react'
import { loadCertificatePayments, loadPaymentRequests, setCertificatePaid } from '../academy/admin'
import { modules, totalLessons } from '../academy/content'
import { formatDate } from './data'
import { Alert, Empty } from './ui'

// Lazy-loaded from AdminDashboard. It is the only thing in the portal that
// needs the course structure, and the lesson text behind that import is far
// too large to put in the chunk every signed-in user downloads.

function Stat({ value, label, hint }) {
  return (
    <div className="card !p-5">
      <p className="font-display text-2xl font-700 text-white">{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-500">{label}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  )
}

function Bar({ done, total }) {
  const percent = Math.round((done / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-aim-blue to-cyan-glow" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs tabular-nums text-slate-400">
        {done}/{total}
      </span>
    </div>
  )
}

function StageBadge({ learner }) {
  // Three states worth distinguishing at a glance: finished, working through
  // it, and signed up but stalled. Anything finer belongs in the row itself.
  const stage = learner.final_passed
    ? ['Certified', 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300']
    : learner.lessons_done > 0
      ? ['In progress', 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow']
      : ['Started', 'border-white/15 bg-white/5 text-slate-400']
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${stage[1]}`}>
      {stage[0]}
    </span>
  )
}

// The learner rows are loaded by AdminDashboard along with everything else,
// because the tab label carries the count and so it cannot wait for a click.
// This screen is handed them rather than fetching the same RPC a second time.
export default function AcademyProgress({ learners, error }) {
  const [query, setQuery] = useState('')
  const [paid, setPaid] = useState(new Set())
  const [requested, setRequested] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [payError, setPayError] = useState('')

  useEffect(() => {
    loadCertificatePayments().then((r) => {
      if (r.error) setPayError(r.error.message)
      else setPaid(r.paid)
    })
    // Quiet on failure: the marker is a convenience, and the message in the
    // person's thread says the same thing.
    loadPaymentRequests().then((r) => {
      if (!r.error) setRequested(r.requested)
    })
  }, [])

  const togglePaid = async (userId) => {
    const next = !paid.has(userId)
    setBusyId(userId)
    setPayError('')
    const { error } = await setCertificatePaid(userId, next)
    setBusyId(null)
    if (error) return setPayError(error.message)
    setPaid((prev) => {
      const copy = new Set(prev)
      if (next) copy.add(userId)
      else copy.delete(userId)
      return copy
    })
  }

  const needle = query.trim().toLowerCase()
  const matching = useMemo(
    () =>
      (learners ?? []).filter((l) =>
        !needle
          ? true
          : [l.full_name, l.email, l.company].filter(Boolean).some((f) => f.toLowerCase().includes(needle))
      ),
    [learners, needle]
  )

  // The likeliest cause by far is academy.sql not having been run yet, and a
  // bare "function does not exist" would send someone looking in the wrong
  // place entirely.
  if (error) {
    return (
      <Alert>
        {error} — if this mentions a missing function, run supabase/academy.sql in the Supabase SQL editor.
      </Alert>
    )
  }
  if (!learners) return <p className="text-sm text-slate-400">Loading Academy progress…</p>

  const certified = learners.filter((l) => l.final_passed).length
  const awaitingPayment = learners.filter((l) => l.final_passed && !paid.has(l.user_id)).length
  const requestedCount = learners.filter((l) => l.final_passed && !paid.has(l.user_id) && requested[l.user_id]).length
  const finished = learners.filter((l) => l.lessons_done >= totalLessons).length

  return (
    <>
      {payError && (
        <div className="mb-4">
          <Alert>{payError} — if this mentions a missing function or table, run supabase/academy.sql.</Alert>
        </div>
      )}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Stat value={learners.length} label="Learners started" hint="Anyone who has completed a lesson or sat a quiz." />
        <Stat value={finished} label="Finished the reading" hint={`All ${totalLessons} lessons marked complete.`} />
        <Stat value={certified} label="Certified" hint="Passed the final assessment." />
        <Stat value={awaitingPayment} label="Awaiting payment" hint={`Passed, but not paid for. ${requestedCount} asked for the link.`} />
      </div>

      {learners.length === 0 ? (
        <Empty>
          Nobody has started the course yet. It is at <code className="text-xs text-slate-300">/academy</code>, open to
          anyone signed in.
        </Empty>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              className="input !py-2 !text-xs sm:max-w-sm"
              placeholder="Search learners by name, email or company…"
            />
            {query && (
              <span className="text-xs text-slate-500">
                {matching.length} of {learners.length}
              </span>
            )}
          </div>

          {matching.length === 0 ? (
            <Empty>Nobody here matches that search.</Empty>
          ) : (
            // Horizontal scroll rather than a stacked card layout on phones:
            // this is a comparison table, and six numbers per person are only
            // worth anything side by side.
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/15 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 pr-4 font-semibold">Learner</th>
                    <th className="py-2.5 pr-4 font-semibold">Lessons</th>
                    <th className="py-2.5 pr-4 font-semibold">Quizzes passed</th>
                    <th className="py-2.5 pr-4 font-semibold">Attempts</th>
                    <th className="py-2.5 pr-4 font-semibold">Status</th>
                    <th className="py-2.5 pr-4 font-semibold">Last active</th>
                    <th className="py-2.5 font-semibold">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {matching.map((l) => (
                    <tr key={l.user_id} className="border-b border-white/5 align-middle">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-white">{l.full_name || l.email}</p>
                        <p className="text-xs text-slate-500">
                          {l.full_name ? l.email : null}
                          {l.company ? `${l.full_name ? ' · ' : ''}${l.company}` : ''}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <Bar done={l.lessons_done} total={totalLessons} />
                      </td>
                      {/* The final counts as an assessment in the function's
                          tally, so the denominator is the modules plus it. */}
                      <td className="py-3 pr-4 tabular-nums text-slate-400">
                        {l.assessments_passed}/{modules.length + 1}
                      </td>
                      {/* Attempts beside passes is the point of keeping the
                          history: eight attempts for six passes is a different
                          training record from six for six. */}
                      <td className="py-3 pr-4 tabular-nums text-slate-400">{l.attempts}</td>
                      <td className="py-3 pr-4">
                        <StageBadge learner={l} />
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-400">
                        {l.last_activity ? formatDate(l.last_activity) : '—'}
                      </td>
                      <td className="py-3">
                        {l.final_passed ? (
                          <button
                            onClick={() => togglePaid(l.user_id)}
                            disabled={busyId === l.user_id}
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide disabled:opacity-50 ${
                              paid.has(l.user_id)
                                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                                : 'border-white/15 bg-white/5 text-slate-300 hover:border-cyan-glow/40'
                            }`}
                            title={paid.has(l.user_id) ? 'Click to take back' : 'Click once payment has arrived'}
                          >
                            {paid.has(l.user_id) ? 'Paid' : 'Mark paid'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                        {/* Asked for the link and not yet paid: the one state an
                            admin has to act on. Gone once marked paid. */}
                        {l.final_passed && !paid.has(l.user_id) && requested[l.user_id] && (
                          <p className="mt-1.5 text-[11px] font-semibold text-amber-300">
                            Requested {formatDate(requested[l.user_id])}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}
