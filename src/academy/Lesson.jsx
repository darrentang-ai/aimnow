import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { findLesson, lessonId, neighbours } from './content'
import { Blocks } from './ui'

export default function Lesson({ state, onComplete, onUncomplete, onExercise }) {
  const { moduleSlug, lessonSlug } = useParams()
  const { module: mod, lesson } = findLesson(moduleSlug, lessonSlug)

  // A lesson is a page of reading, so arriving part-way down the previous one
  // is disorienting. Router scroll restoration only covers back/forward.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [moduleSlug, lessonSlug])

  if (!mod || !lesson) return <Navigate to="/academy" replace />

  const id = lessonId(mod.slug, lesson.slug)
  const done = state.completed.has(id)
  const index = mod.lessons.indexOf(lesson)
  const { next } = neighbours(`/academy/${mod.slug}/${lesson.slug}`)

  return (
    <article className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-glow">
        {mod.title} · Lesson {index + 1} of {mod.lessons.length}
      </p>
      <h1 className="mt-2 font-display text-2xl font-700 leading-tight text-white sm:text-3xl">{lesson.title}</h1>
      <p className="mt-2 text-xs text-slate-500">About {lesson.minutes} minutes</p>

      <div className="mt-8">
        <Blocks blocks={lesson.blocks} exercises={state.exercises} onExercise={onExercise} />
      </div>

      {/* Completion is the learner's own assertion that they have read it.
          Inferring it from scroll position was the alternative and it lies in
          both directions — a long page skimmed in four seconds counts, and a
          short page read carefully on a tall screen never does. */}
      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
        {done ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              ✓ Completed
            </span>
            <button
              onClick={() => onUncomplete(id)}
              className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-300"
            >
              Mark as unfinished
            </button>
          </>
        ) : (
          <button onClick={() => onComplete(id)} className="btn-ghost !py-3">
            Mark lesson complete
          </button>
        )}

        {next && (
          <Link
            to={next.to}
            // Completing and moving on are kept separate: pressing Next without
            // marking it read is a legitimate thing to do when you are
            // skimming back through material you already know.
            onClick={() => !done && onComplete(id)}
            className="btn-primary ml-auto !py-3"
          >
            {next.kind === 'quiz' ? 'Continue to quiz' : next.kind === 'final' ? 'Final assessment' : 'Next lesson'} →
          </Link>
        )}
      </div>
    </article>
  )
}
