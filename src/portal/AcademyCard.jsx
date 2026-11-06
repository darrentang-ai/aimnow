import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { CERTIFICATE_PRICE, COURSE_HOURS, COURSE_OUTCOMES, COURSE_SHAPE, MODULE_SHAPE } from '../academy/ids'
import { loadMySummary } from '../academy/summary'

// The Academy's home on the dashboards. It is here rather than in the hero on
// the marketing page because the course is members-only: these are the people
// who can actually open it, and there is no sign-in wall between this card and
// the first lesson.
//
// Imports ../academy/ids and ../academy/summary only — never ../academy/content
// — so the portal bundle carries a few constants and a query, not the lessons.
// COURSE_SHAPE and MODULE_SHAPE are checked against the real course in
// development; see the note in src/academy/content/index.js.
//
// It says up front that the certificate is paid for. The course and the final
// assessment are free, and someone who finds out about the fee only after
// passing has been given a reason to resent the whole thing.
//
// On every dashboard, but the certificate counts towards joining the network
// only for an applicant or manager: the applicant heading in ManagerDashboard
// is where that is said.

// A stylised certificate, name blurred: the thing at the end, shown at the
// start. Decorative, so hidden from assistive tech.
function CertificatePreview() {
  return (
    <div
      aria-hidden="true"
      className="hidden w-52 shrink-0 rotate-2 rounded-xl border border-cyan-glow/25 bg-gradient-to-b from-aim-blue/15 to-ink-900 p-4 text-center shadow-glow sm:block"
    >
      <Logo className="mx-auto h-3.5 w-auto" />
      <p className="mt-3 text-[8px] font-semibold uppercase tracking-[0.2em] text-cyan-glow">Certificate of completion</p>
      <p className="mt-3 text-[9px] text-slate-500">This certifies that</p>
      <p className="mt-1 select-none font-display text-sm font-700 text-white blur-[5px]">Your Name Here</p>
      <p className="mt-2 text-[9px] text-slate-500">has completed</p>
      <p className="mt-0.5 font-display text-[11px] font-700 text-white">Generative AI Fundamentals</p>
      <div className="mt-3 border-t border-white/10 pt-2 text-[8px] uppercase tracking-wider text-slate-500">
        AIM Now Academy
      </div>
    </div>
  )
}

export default function AcademyCard({ userId }) {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadMySummary(userId).then((result) => {
      // Silent on failure, like the unread badge: the most likely cause is
      // academy.sql not having been run, and that is not worth an error banner
      // on a screen about someone's projects. The card still invites them in.
      if (!cancelled && !result.error) setSummary(result)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const started = summary && summary.lessonsDone > 0
  const percent = summary ? Math.round((summary.lessonsDone / COURSE_SHAPE.lessons) * 100) : 0

  // One label per state, in the order someone moves through them.
  const label = summary?.certified
    ? summary.paid
      ? 'View your certificate'
      : 'Get your certificate'
    : started
      ? summary.resumeModule
        ? `Resume: Module ${summary.resumeModule}`
        : 'Take the final assessment'
      : 'Start the course'

  return (
    <section className="mt-12">
      <div className="rounded-2xl border border-cyan-glow/20 bg-gradient-to-b from-aim-blue/10 to-transparent p-6">
        <div className="flex items-center justify-between gap-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-glow">AIM Now Academy</p>
              {summary?.certified && (
                <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                  {summary.paid ? 'Certified' : 'Passed'}
                </span>
              )}
            </div>
            <h2 className="mt-1.5 font-display text-lg font-600 text-white">Generative AI Fundamentals</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-300">
              {COURSE_SHAPE.modules} modules, {COURSE_SHAPE.lessons} lessons, about {COURSE_HOURS} hours including
              exercises and quizzes, self-paced. Learn how generative AI behaves, what it’s good for, where it fails, and how to adopt it without regret.
            </p>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-slate-200">
              Free course and final assessment. Verified certificate {CERTIFICATE_PRICE} after you pass. Retake as
              often as you need.
            </p>

            {/* Collapsed so the card stays short, but there for anyone deciding
                whether five hours is worth it. */}
            <details className="group mt-3 max-w-xl">
              <summary className="cursor-pointer text-xs font-semibold text-cyan-glow hover:underline">
                What you’ll learn
              </summary>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {COURSE_OUTCOMES.map((o) => (
                  <li key={o} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-glow" />
                    {o}
                  </li>
                ))}
              </ul>
              <ol className="mt-3 space-y-1 text-xs text-slate-300">
                {MODULE_SHAPE.map((m, i) => (
                  <li key={m.slug}>
                    <span className="text-slate-400">Module {i + 1}</span> · {m.title}
                  </li>
                ))}
              </ol>
            </details>

            {/* Only once the numbers are in. A bar that starts at zero and jumps a
                moment later reads as the course resetting itself. */}
            {started && !summary.certified && (
              <div className="mt-5 flex items-center gap-3">
                <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-aim-blue to-cyan-glow transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs text-slate-300">
                  {summary.lessonsDone} of {COURSE_SHAPE.lessons} lessons
                </span>
              </div>
            )}

            <Link to="/academy" className="btn-primary mt-5 !py-2.5 !text-xs">
              {label}
            </Link>
          </div>
          <CertificatePreview />
        </div>
      </div>
    </section>
  )
}
