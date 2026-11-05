import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { COURSE_SHAPE } from '../academy/ids'
import { loadMySummary } from '../academy/summary'

// The Academy's home on the dashboards. It is here rather than in the hero on
// the marketing page because the course is members-only: these are the people
// who can actually open it, and there is no sign-in wall between this card and
// the first lesson.
//
// Imports ../academy/ids and ../academy/summary only — never ../academy/content
// — so the portal bundle carries two constants and a query, not the lessons.
// COURSE_SHAPE is checked against the real course in development; see the note
// in src/academy/content/index.js.
//
// Says nothing about credentials because this card is on every dashboard, and
// only an applicant or manager has any use for that. For them, the certificate
// counts as one of the two an admin approves: the applicant heading says so,
// and the form in ManagerDashboard is where it gets added.
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

  return (
    <section className="mt-12">
      <div className="rounded-2xl border border-cyan-glow/20 bg-gradient-to-b from-aim-blue/10 to-transparent p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-glow">AIM Now Academy</p>
            <h2 className="mt-1.5 font-display text-lg font-600 text-white">Generative AI Fundamentals</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">
              {COURSE_SHAPE.modules} modules and {COURSE_SHAPE.lessons} lessons on how generative AI behaves, what it is
              good for, where it fails, and how to adopt it without regret. Included with your account.
            </p>
          </div>
          {summary?.certified && (
            <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              Certified
            </span>
          )}
        </div>

        {/* Only once the numbers are in. A bar that starts at zero and jumps a
            moment later reads as the course resetting itself. */}
        {started && (
          <div className="mt-5 flex items-center gap-3">
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-aim-blue to-cyan-glow transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {summary.lessonsDone} of {COURSE_SHAPE.lessons} lessons
            </span>
          </div>
        )}

        <Link to="/academy" className="btn-ghost mt-5 !py-2.5 !text-xs">
          {summary?.certified ? 'View your certificate' : started ? 'Resume the course' : 'Start the course'}
        </Link>
      </div>
    </section>
  )
}
