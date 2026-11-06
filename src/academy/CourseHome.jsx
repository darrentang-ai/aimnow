import { Link } from 'react-router-dom'
import { FINAL_PASS_MARK, MODULE_PASS_MARK, course, modules, totalLessons, totalMinutes } from './content'
import { CERTIFICATE_PRICE, COURSE_OUTCOMES } from './ids'
import { courseState, finalUnlocked, moduleState } from './progress'
import { ProgressBar } from './ui'

function Stat({ value, label }) {
  return (
    <div>
      <p className="font-display text-2xl font-700 text-white">{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}

// Where to send someone who presses the one big button: the first thing they
// have not finished. Resuming beats starting over, and the alternative — always
// linking lesson one — makes the button useless after the first session.
function resumeTarget(state) {
  for (const mod of modules) {
    const ms = moduleState(mod, state)
    if (ms.complete) continue
    const lesson = mod.lessons.find((l) => !state.completed.has(`${mod.slug}/${l.slug}`))
    if (lesson) return `/academy/${mod.slug}/${lesson.slug}`
    return `/academy/${mod.slug}/quiz`
  }
  return '/academy/final'
}

export default function CourseHome({ state }) {
  const cs = courseState(state)
  const started = cs.lessonsDone > 0 || state.attempts.length > 0
  const resume = cs.certified ? '/academy/certificate' : resumeTarget(state)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="chip">AIM Now Academy</div>
      <h1 className="mt-5 font-display text-3xl font-700 leading-tight text-white sm:text-4xl">{course.title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">{course.subtitle}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{course.audience}</p>

      {/* What someone can do afterwards, not what the lessons contain. */}
      <ul className="mt-5 space-y-1.5 text-sm text-slate-200">
        {COURSE_OUTCOMES.map((o) => (
          <li key={o} className="flex gap-2.5">
            <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-glow" />
            {o}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-center gap-8">
        <Stat value={modules.length} label="Modules" />
        <Stat value={totalLessons} label="Lessons" />
        <Stat value={`${Math.round(totalMinutes / 60)} hrs`} label="Incl. exercises and quizzes" />
        {/* "Not started" until the first lesson: 0% beside an empty bar reads
            as a failing score on a first visit, not as a starting line. */}
        <Stat value={started ? `${cs.percent}%` : 'Not started'} label="Progress" />
      </div>

      {started && (
        <div className="mt-6">
          <ProgressBar percent={cs.percent} />
          <p className="mt-2 text-xs text-slate-300">
            {cs.lessonsDone} of {cs.lessonsTotal} lessons · {cs.modulesComplete} of {cs.modulesTotal} modules finished
            {cs.finalPassed && ' · final assessment passed'}
          </p>
        </div>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <Link to={resume} className="btn-primary">
          {cs.certified ? 'View your certificate' : started ? 'Resume where you left off' : 'Start the course'}
        </Link>
        {finalUnlocked(state) && !cs.certified && (
          <Link to="/academy/final" className="btn-ghost">
            Take the final assessment
          </Link>
        )}
      </div>
      {/* Under the button because it is the one thing being sold, and the
          course's own page should not be the last place anyone hears of it. */}
      <p className="mt-3 text-sm text-slate-300">
        Free course and final assessment · Certificate {CERTIFICATE_PRICE} on passing · Retake as often as you need
      </p>
      <p className="mt-1.5 text-xs text-slate-400">
        Published by AIM Now Academy. Every certificate has a public link anyone can use to check it.
      </p>

      <h2 className="mt-14 font-display text-xl font-700 text-white">Course outline</h2>
      <ol className="mt-5 space-y-3">
        {modules.map((mod, i) => {
          const ms = moduleState(mod, state)
          const minutes = mod.lessons.reduce((s, l) => s + l.minutes, 0)
          return (
            <li key={mod.slug}>
              <Link
                to={`/academy/${mod.slug}/${mod.lessons[0].slug}`}
                className="card card-hover block"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-glow">
                      Module {i + 1} · {minutes} min
                    </p>
                    <h3 className="mt-1.5 font-display text-lg font-700 text-white">{mod.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">{mod.summary}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      ms.complete
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                        : ms.lessonsDone > 0
                          ? 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow'
                          : 'border-white/15 bg-white/5 text-slate-400'
                    }`}
                  >
                    {ms.complete ? 'Complete' : ms.lessonsDone > 0 ? 'In progress' : 'Not started'}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <ProgressBar percent={Math.round((ms.lessonsDone / ms.lessonsTotal) * 100)} className="max-w-xs" />
                  <span className="shrink-0 text-xs text-slate-400">
                    {ms.lessonsDone}/{ms.lessonsTotal} lessons{ms.quizPassed ? ' · quiz passed' : ''}
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ol>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-display text-lg font-700 text-white">How this course is assessed</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Each module ends in a short quiz you need {MODULE_PASS_MARK}% on to clear. Once every module is finished, the
          final assessment unlocks — {course.final.questions.length} questions across the whole course, {FINAL_PASS_MARK}
          % to pass. Retakes are unlimited, and every attempt is kept on your record. The course and the final
          assessment are free; the verified certificate, issued once you pass, is {CERTIFICATE_PRICE}.
        </p>
      </div>
    </div>
  )
}
