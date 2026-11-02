import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Alert } from '../portal/ui'
import {
  FINAL_ID,
  FINAL_PASS_MARK,
  MODULE_PASS_MARK,
  finalAssessment,
  findModule,
  neighbours,
} from './content'
import { bestAttempt, finalUnlocked, gradeAnswers, hasPassed } from './progress'

function Scoreboard({ attempt, passMark }) {
  const percent = Math.round((attempt.score / attempt.total) * 100)
  return (
    <div
      className={`rounded-2xl border p-6 ${
        attempt.passed
          ? 'border-emerald-400/30 bg-emerald-400/10'
          : 'border-amber-400/30 bg-amber-400/10'
      }`}
    >
      <p className={`font-display text-2xl font-700 ${attempt.passed ? 'text-emerald-300' : 'text-amber-300'}`}>
        {attempt.score} / {attempt.total} · {percent}%
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
        {attempt.passed
          ? `Passed — ${passMark}% was needed.`
          : `Not passed yet. ${passMark}% is the bar, so there are a few to revisit. Your answers are marked below.`}
      </p>
    </div>
  )
}

function Question({ question, index, chosen, marked, onChoose }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-[15px] font-semibold leading-relaxed text-white">
        <span className="mr-2 text-cyan-glow">{index + 1}.</span>
        {question.prompt}
      </p>
      <ul className="mt-4 space-y-2">
        {question.options.map((option, i) => {
          const isChosen = chosen === i
          const isAnswer = question.answer === i
          // Before marking, only the choice is shown. After marking, the right
          // answer is always highlighted — a quiz that tells you that you are
          // wrong without telling you what is right teaches nothing.
          const tone = !marked
            ? isChosen
              ? 'border-cyan-glow/60 bg-cyan-glow/10 text-white'
              : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25 hover:bg-white/5'
            : isAnswer
              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
              : isChosen
                ? 'border-red-400/40 bg-red-400/10 text-red-200'
                : 'border-white/10 bg-white/[0.02] text-slate-500'
          return (
            <li key={i}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed transition-colors ${tone} ${
                  marked ? 'cursor-default' : ''
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={isChosen}
                  disabled={marked}
                  onChange={() => onChoose(question.id, i)}
                  className="mt-1 h-3.5 w-3.5 shrink-0 accent-cyan-glow"
                />
                <span>{option}</span>
              </label>
            </li>
          )
        })}
      </ul>
      {marked && (
        <p className="mt-3 rounded-xl border border-white/10 bg-ink-800 px-4 py-3 text-[13px] leading-relaxed text-slate-400">
          <span className="font-semibold text-slate-300">Why: </span>
          {question.why}
        </p>
      )}
    </li>
  )
}

// One component for both kinds of assessment. They differ in the pass mark, the
// question set and what follows a pass — not in how they behave, and two
// near-identical screens would drift apart.
export default function Quiz({ kind, state, onSubmit }) {
  const { moduleSlug } = useParams()
  const mod = kind === 'module' ? findModule(moduleSlug) : null

  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Switching between module quizzes reuses this component, so the previous
  // quiz's answers have to be cleared explicitly.
  useEffect(() => {
    setAnswers({})
    setResult(null)
    setError('')
    window.scrollTo({ top: 0 })
  }, [kind, moduleSlug])

  const config = useMemo(() => {
    if (kind === 'final') {
      return {
        id: FINAL_ID,
        title: finalAssessment.title,
        eyebrow: 'Final assessment',
        summary: finalAssessment.summary,
        questions: finalAssessment.questions,
        passMark: FINAL_PASS_MARK,
      }
    }
    if (!mod) return null
    return {
      id: mod.slug,
      title: `${mod.title} — quiz`,
      eyebrow: mod.title,
      summary: `${mod.quiz.questions.length} questions on this module. ${MODULE_PASS_MARK}% to clear it, and you can retake it as often as you like.`,
      questions: mod.quiz.questions,
      passMark: MODULE_PASS_MARK,
    }
  }, [kind, mod])

  if (!config) return <Navigate to="/academy" replace />

  if (kind === 'final' && !finalUnlocked(state)) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-700 text-white">Final assessment</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          This unlocks once every module is finished — all lessons marked complete and every module quiz passed. It
          covers the whole course, so sitting it early would mostly measure guessing.
        </p>
        <Link to="/academy" className="btn-ghost mt-6">
          Back to the course
        </Link>
      </div>
    )
  }

  const previousBest = bestAttempt(state.attempts, config.id)
  const alreadyPassed = hasPassed(state.attempts, config.id)
  const marked = Boolean(result)
  const answered = config.questions.filter((q) => answers[q.id] !== undefined).length
  const complete = answered === config.questions.length
  const { next } = kind === 'module' ? neighbours(`/academy/${moduleSlug}/quiz`) : { next: null }

  const submit = async () => {
    setBusy(true)
    setError('')
    const { score, total } = gradeAnswers(config.questions, answers)
    const { attempt, error } = await onSubmit({
      assessmentId: config.id,
      score,
      total,
      passMark: config.passMark,
      answers,
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setResult(attempt)
    window.scrollTo({ top: 0 })
  }

  const retake = () => {
    setAnswers({})
    setResult(null)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-glow">{config.eyebrow}</p>
      <h1 className="mt-2 font-display text-2xl font-700 text-white sm:text-3xl">{config.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">{config.summary}</p>

      {!marked && previousBest && (
        <p className="mt-4 text-xs text-slate-500">
          Best so far: {previousBest.score}/{previousBest.total}
          {alreadyPassed && ' · already passed'}
        </p>
      )}

      {marked && (
        <div className="mt-6">
          <Scoreboard attempt={result} passMark={config.passMark} />
        </div>
      )}

      {error && (
        <div className="mt-6">
          <Alert>{error}</Alert>
        </div>
      )}

      <ol className="mt-8 space-y-4">
        {config.questions.map((q, i) => (
          <Question
            key={q.id}
            question={q}
            index={i}
            chosen={answers[q.id]}
            marked={marked}
            onChoose={(id, choice) => setAnswers((prev) => ({ ...prev, [id]: choice }))}
          />
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
        {!marked ? (
          <>
            <button onClick={submit} disabled={!complete || busy} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? 'Marking…' : 'Submit answers'}
            </button>
            <span className="text-xs text-slate-500">
              {answered} of {config.questions.length} answered
            </span>
          </>
        ) : (
          <>
            <button onClick={retake} className="btn-ghost">
              Retake
            </button>
            {result.passed && kind === 'module' && next && (
              <Link to={next.to} className="btn-primary ml-auto">
                {next.kind === 'final' ? 'Final assessment' : 'Next module'} →
              </Link>
            )}
            {result.passed && kind === 'final' && (
              <Link to="/academy/certificate" className="btn-primary ml-auto">
                View your certificate →
              </Link>
            )}
            {!result.passed && (
              <Link to="/academy" className="ml-auto text-xs font-semibold text-slate-400 hover:text-cyan-glow">
                Back to the course
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}
