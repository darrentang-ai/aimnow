import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from '../components/Logo'
import { modules } from './content'
import { moduleState } from './progress'
import { approximateTokens } from './tokens'

// Academy chrome. Closer to the portal's than to the marketing navbar — this is
// a signed-in tool — but it carries its own nav, because a course needs the
// whole contents list visible while you work through it.
export function AcademyShell({ email, onSignOut, sidebar, children }) {
  return (
    <div className="min-h-screen bg-ink-900">
      {/* print:hidden here and on the contents list so the certificate prints
          as the certificate, not as a screenshot of the app around it. */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/80 backdrop-blur-xl print:hidden">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="transition-opacity hover:opacity-80" aria-label="Back to aimnow.io">
              <Logo className="h-7 w-auto" />
            </Link>
            <Link to="/academy" className="text-sm font-semibold text-slate-300 hover:text-cyan-glow">
              Academy
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/portal" className="hidden text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-glow sm:block">
              Portal
            </Link>
            {email && (
              <>
                <span className="hidden text-xs text-slate-400 md:block">{email}</span>
                <button
                  onClick={onSignOut}
                  className="text-xs font-semibold text-slate-300 transition-colors hover:text-cyan-glow"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="container-x py-8 md:py-12">
        {sidebar ? (
          <div className="grid gap-8 lg:grid-cols-[18rem,1fr] lg:gap-12">
            {/* Order matters on small screens: contents above the lesson would
                put a full course outline between the learner and the thing
                they clicked. */}
            <div className="order-2 lg:order-1 print:hidden">{sidebar}</div>
            <div className="order-1 min-w-0 lg:order-2">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export function ProgressBar({ percent, className = '' }) {
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-white/10 ${className}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-aim-blue to-cyan-glow transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

// A tick, a ring or a hollow circle. Deliberately not a checkbox: completion is
// recorded by finishing a lesson, and an input here would suggest it is toggled
// from the contents list.
export function StateDot({ state }) {
  if (state === 'done') {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-glow text-[9px] font-bold text-ink-900">
        ✓
      </span>
    )
  }
  if (state === 'current') {
    return <span className="h-4 w-4 shrink-0 rounded-full border-2 border-cyan-glow bg-cyan-glow/20" />
  }
  return <span className="h-4 w-4 shrink-0 rounded-full border border-white/25" />
}

export function Contents({ state }) {
  return (
    <nav aria-label="Course contents" className="lg:sticky lg:top-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Contents</p>
      <ol className="space-y-5">
        {modules.map((mod, i) => {
          const ms = moduleState(mod, state)
          return (
            <li key={mod.slug}>
              <p className="mb-2 flex items-baseline gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span className="text-cyan-glow">{String(i + 1).padStart(2, '0')}</span>
                <span className="normal-case tracking-normal text-slate-300">{mod.title}</span>
              </p>
              <ul className="space-y-0.5 border-l border-white/10 pl-3">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <NavLink
                      to={`/academy/${mod.slug}/${lesson.slug}`}
                      className={({ isActive }) =>
                        `flex items-start gap-2 rounded-lg px-2 py-1.5 text-[13px] leading-snug transition-colors ${
                          isActive ? 'bg-white/[0.07] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <StateDot
                            state={
                              state.completed.has(`${mod.slug}/${lesson.slug}`)
                                ? 'done'
                                : isActive
                                  ? 'current'
                                  : 'todo'
                            }
                          />
                          <span>{lesson.title}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <NavLink
                    to={`/academy/${mod.slug}/quiz`}
                    className={({ isActive }) =>
                      `flex items-start gap-2 rounded-lg px-2 py-1.5 text-[13px] font-semibold leading-snug transition-colors ${
                        isActive ? 'bg-white/[0.07] text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <StateDot state={ms.quizPassed ? 'done' : isActive ? 'current' : 'todo'} />
                        <span>Quiz</span>
                      </>
                    )}
                  </NavLink>
                </li>
              </ul>
            </li>
          )
        })}
        <li>
          <NavLink
            to="/academy/final"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-semibold transition-colors ${
                isActive ? 'bg-white/[0.07] text-white' : 'text-slate-300 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <StateDot state={state.finalPassed ? 'done' : isActive ? 'current' : 'todo'} />
                <span>Final assessment</span>
              </>
            )}
          </NavLink>
        </li>
      </ol>
    </nav>
  )
}

// -----------------------------------------------------------------------------
// Lesson body renderer.
//
// Lessons are authored as arrays of typed blocks rather than HTML or markdown:
// the content files stay readable, nothing from them is ever injected as
// markup, and the whole course restyles from this one function.
// -----------------------------------------------------------------------------

// `exercises` is the learner's saved results keyed by exercise id, and
// `onExercise` saves one. Both are optional: the inline checks need neither,
// and a caller that only wants to render prose can leave them out.
export function Blocks({ blocks, exercises = {}, onExercise }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => (
        <Block key={b.id ?? i} block={b} saved={b.id ? exercises[b.id] : undefined} onExercise={onExercise} />
      ))}
    </div>
  )
}

function Block({ block, saved, onExercise }) {
  switch (block.type) {
    case 'h':
      return <h2 className="pt-3 font-display text-lg font-700 text-white">{block.text}</h2>

    case 'p':
      return <p className="text-[15px] leading-relaxed text-slate-300">{block.text}</p>

    case 'list':
      return (
        <ul className="space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-300">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-glow/70" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )

    case 'steps':
      return (
        <ol className="space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-300">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-glow/30 bg-cyan-glow/10 text-xs font-semibold text-cyan-glow">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )

    case 'key':
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item) => (
            <div key={item.term} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="text-sm font-semibold text-white">{item.term}</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-slate-400">{item.def}</dd>
            </div>
          ))}
        </dl>
      )

    case 'callout':
      return (
        <div className="rounded-2xl border border-cyan-glow/25 bg-gradient-to-b from-aim-blue/10 to-transparent p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-glow">{block.title}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-200">{block.text}</p>
        </div>
      )

    case 'example':
      return (
        <figure className="overflow-hidden rounded-2xl border border-white/10 bg-ink-800">
          <figcaption className="border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {block.title}
          </figcaption>
          {/* whitespace-pre-wrap so an authored prompt keeps its line breaks —
              the shape of a prompt is part of what is being taught. */}
          <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-sans text-[13px] leading-relaxed text-slate-300">
            {block.text}
          </pre>
        </figure>
      )

    case 'table':
      return (
        <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[32rem] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/15">
                {block.head.map((h) => (
                  <th key={h} className="py-2.5 pr-4 font-semibold uppercase tracking-wider text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-white/5 align-top">
                  {row.map((cell, j) => (
                    <td key={j} className={`py-2.5 pr-4 leading-relaxed ${j === 0 ? 'text-slate-200' : 'text-slate-400'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'check':
      return <InlineCheck block={block} />

    case 'spotter':
      return <Spotter block={block} saved={saved} onExercise={onExercise} />

    // Two block types, one component: sorting tasks by fit and triaging
    // problems by approach are the same mechanic with different content, and a
    // second near-identical component would only drift away from this one.
    case 'triage':
    case 'sorter':
      return <BucketDrill block={block} saved={saved} onExercise={onExercise} />

    case 'scenario':
      return <Scenario block={block} saved={saved} onExercise={onExercise} />

    case 'tokeniser':
      return <Tokeniser block={block} />

    default:
      // An unknown type is an authoring mistake, not a user-facing error.
      return null
  }
}

// -----------------------------------------------------------------------------
// Exercises.
//
// All marking is client-side against the authored answer. The answer key is in
// the bundle either way, so server marking would buy nothing here — and unlike
// the quizzes, none of this is recorded as an assessment or gates anything.
// -----------------------------------------------------------------------------

function ExerciseFrame({ eyebrow, title, instruction, children }) {
  return (
    <section className="rounded-2xl border border-white/15 bg-ink-800 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-glow">{eyebrow}</p>
      {title && <h3 className="mt-1.5 font-display text-base font-700 text-white">{title}</h3>}
      {instruction && <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{instruction}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

// Retrieval practice mid-lesson: answer, see why, read on. Deliberately not
// recorded anywhere — it is there to make you pull the idea out of memory
// rather than re-read it, and scoring it would turn it into a test people
// answer cautiously instead of honestly.
function InlineCheck({ block }) {
  const [chosen, setChosen] = useState(null)
  const answered = chosen !== null
  const correct = chosen === block.answer

  return (
    <ExerciseFrame eyebrow="Check yourself">
      <p className="text-[15px] font-semibold leading-relaxed text-white">{block.prompt}</p>
      <ul className="mt-3 space-y-2">
        {block.options.map((option, i) => {
          const isChosen = chosen === i
          const isAnswer = block.answer === i
          const tone = !answered
            ? 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25 hover:bg-white/5'
            : isAnswer
              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
              : isChosen
                ? 'border-red-400/40 bg-red-400/10 text-red-200'
                : 'border-white/10 bg-white/[0.02] text-slate-500'
          return (
            <li key={i}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setChosen(i)}
                className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm leading-relaxed transition-colors ${tone} disabled:cursor-default`}
              >
                {option}
              </button>
            </li>
          )
        })}
      </ul>
      {answered && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className={`text-xs font-semibold uppercase tracking-wider ${correct ? 'text-emerald-300' : 'text-amber-300'}`}>
            {correct ? 'That’s it' : 'Not quite'}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">{block.why}</p>
          <button
            type="button"
            onClick={() => setChosen(null)}
            className="mt-2 text-xs font-semibold text-slate-500 transition-colors hover:text-cyan-glow"
          >
            Reset
          </button>
        </div>
      )}
    </ExerciseFrame>
  )
}

// Spot the unsupported claims in an AI summary of a source. The one exercise
// here that rehearses the actual job skill from module 4 — reading output
// against a source rather than for fluency — so it is marked per decision,
// including the claims you wrongly flagged.
function Spotter({ block, saved, onExercise }) {
  const [flagged, setFlagged] = useState(() => new Set(saved?.response?.flagged ?? []))
  const [marked, setMarked] = useState(Boolean(saved))

  const score = block.claims.filter((c) => flagged.has(c.id) === !c.supported).length

  const submit = () => {
    setMarked(true)
    onExercise?.(block.id, {
      score: block.claims.filter((c) => flagged.has(c.id) === !c.supported).length,
      total: block.claims.length,
      response: { flagged: [...flagged] },
    })
  }

  const toggle = (id) => {
    if (marked) return
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <ExerciseFrame eyebrow="Exercise" title={block.title} instruction={block.instruction}>
      <div className="rounded-xl border border-white/10 bg-ink-900 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{block.sourceTitle}</p>
        <div className="mt-2 space-y-2">
          {block.source.map((line, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-slate-400">
              {line}
            </p>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{block.summaryTitle}</p>
      <ul className="mt-2 space-y-2">
        {block.claims.map((claim) => {
          const isFlagged = flagged.has(claim.id)
          const right = isFlagged === !claim.supported
          const tone = !marked
            ? isFlagged
              ? 'border-amber-400/50 bg-amber-400/10 text-amber-100'
              : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25 hover:bg-white/5'
            : right
              ? 'border-emerald-400/40 bg-emerald-400/[0.07] text-slate-200'
              : 'border-red-400/40 bg-red-400/[0.07] text-slate-200'
          return (
            <li key={claim.id}>
              <button
                type="button"
                onClick={() => toggle(claim.id)}
                aria-pressed={isFlagged}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm leading-relaxed transition-colors ${tone} ${
                  marked ? 'cursor-default' : ''
                }`}
              >
                <span className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                      isFlagged ? 'border-amber-300 bg-amber-300 text-ink-900' : 'border-white/30'
                    }`}
                  >
                    {isFlagged ? '!' : ''}
                  </span>
                  <span>{claim.text}</span>
                </span>
                {marked && (
                  <span className="mt-2 block border-t border-white/10 pt-2 text-[12px] leading-relaxed text-slate-400">
                    <span className={`font-semibold ${right ? 'text-emerald-300' : 'text-red-300'}`}>
                      {claim.supported
                        ? isFlagged
                          ? 'Supported — flagged in error. '
                          : 'Supported, correctly left alone. '
                        : isFlagged
                          ? 'Unsupported — caught it. '
                          : 'Unsupported — missed. '}
                    </span>
                    {claim.note}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <ExerciseFooter
        marked={marked}
        score={score}
        total={block.claims.length}
        canSubmit={flagged.size > 0}
        submitLabel="Mark my review"
        hint="Flag every claim the source does not support. Leaving a supported claim alone counts too."
        onSubmit={submit}
        onReset={() => {
          setFlagged(new Set())
          setMarked(false)
        }}
      />
    </ExerciseFrame>
  )
}

// Put each item in a bucket, then see the reasoning for every one. Drilled
// rather than explained because these are the judgements that read as obvious
// in a table and stop being obvious the moment you have to commit to one.
function BucketDrill({ block, saved, onExercise }) {
  const [choices, setChoices] = useState(() => saved?.response?.choices ?? {})
  const [marked, setMarked] = useState(Boolean(saved))

  const score = block.items.filter((item) => choices[item.id] === item.answer).length
  const answered = block.items.filter((item) => choices[item.id] !== undefined).length

  return (
    <ExerciseFrame eyebrow="Exercise" title={block.title} instruction={block.instruction}>
      <ul className="space-y-3">
        {block.items.map((item) => {
          const chosen = choices[item.id]
          const right = chosen === item.answer
          return (
            <li key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm leading-relaxed text-slate-200">{item.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {block.options.map((option, i) => {
                  const isChosen = chosen === i
                  const tone = !marked
                    ? isChosen
                      ? 'border-cyan-glow/60 bg-cyan-glow/10 text-white'
                      : 'border-white/15 bg-white/5 text-slate-400 hover:border-white/30 hover:text-slate-200'
                    : i === item.answer
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                      : isChosen
                        ? 'border-red-400/40 bg-red-400/10 text-red-200'
                        : 'border-white/10 bg-white/[0.02] text-slate-600'
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={marked}
                      onClick={() => setChoices((prev) => ({ ...prev, [item.id]: i }))}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${tone} disabled:cursor-default`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
              {marked && (
                <p className="mt-3 border-t border-white/10 pt-2.5 text-[12px] leading-relaxed text-slate-400">
                  <span className={`font-semibold ${right ? 'text-emerald-300' : 'text-red-300'}`}>
                    {right ? 'Right. ' : `${block.options[item.answer]}. `}
                  </span>
                  {item.why}
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <ExerciseFooter
        marked={marked}
        score={score}
        total={block.items.length}
        canSubmit={answered === block.items.length}
        submitLabel="Mark my answers"
        hint={`${answered} of ${block.items.length} sorted`}
        onSubmit={() => {
          setMarked(true)
          onExercise?.(block.id, {
            score: block.items.filter((item) => choices[item.id] === item.answer).length,
            total: block.items.length,
            response: { choices },
          })
        }}
        onReset={() => {
          setChoices({})
          setMarked(false)
        }}
      />
    </ExerciseFrame>
  )
}

// Three linked situations, each with consequences rather than a mark. Written
// as ratings, not right and wrong, because governance calls mostly are —
// "defensible but" is the most common answer in real life and the most
// instructive one here.
const RATING_TONE = {
  best: 'border-emerald-400/40 bg-emerald-400/[0.07]',
  partial: 'border-amber-400/40 bg-amber-400/[0.07]',
  poor: 'border-red-400/40 bg-red-400/[0.07]',
}

const RATING_LABEL = {
  best: 'The call to make',
  partial: 'Defensible, but',
  poor: 'How this goes wrong',
}

const RATING_TEXT = {
  best: 'text-emerald-300',
  partial: 'text-amber-300',
  poor: 'text-red-300',
}

function Scenario({ block, saved, onExercise }) {
  const [choices, setChoices] = useState(() => saved?.response?.choices ?? {})
  // How many situations are on screen. Revealing them one at a time is the
  // point: seeing situation three before answering situation two would let you
  // read the consequence backwards off the question.
  const [visible, setVisible] = useState(() => (saved ? block.steps.length : 1))

  const scoreFrom = (map) =>
    block.steps.filter((s) => s.options[map[s.id]]?.rating === 'best').length

  const done = block.steps.every((s) => choices[s.id] !== undefined) && visible === block.steps.length

  const choose = (stepId, index) => {
    const next = { ...choices, [stepId]: index }
    setChoices(next)
    if (block.steps.every((s) => next[s.id] !== undefined)) {
      onExercise?.(block.id, {
        score: scoreFrom(next),
        total: block.steps.length,
        response: { choices: next },
      })
    }
  }

  return (
    <ExerciseFrame eyebrow="Exercise" title={block.title} instruction={block.instruction}>
      <ol className="space-y-4">
        {block.steps.slice(0, visible).map((step, stepIndex) => {
          const chosen = choices[step.id]
          const answered = chosen !== undefined
          const picked = answered ? step.options[chosen] : null
          return (
            <li key={step.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Situation {stepIndex + 1} of {block.steps.length}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{step.situation}</p>
              <ul className="mt-3 space-y-2">
                {step.options.map((option, i) => {
                  const isChosen = chosen === i
                  const tone = !answered
                    ? 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25 hover:bg-white/5'
                    : isChosen
                      ? `${RATING_TONE[option.rating]} text-slate-100`
                      : 'border-white/10 bg-white/[0.02] text-slate-600'
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        disabled={answered}
                        onClick={() => choose(step.id, i)}
                        className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm leading-relaxed transition-colors ${tone} disabled:cursor-default`}
                      >
                        {option.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
              {answered && (
                <div className="mt-3 rounded-xl border border-white/10 bg-ink-900 px-4 py-3">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${RATING_TEXT[picked.rating]}`}>
                    {RATING_LABEL[picked.rating]}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">{picked.outcome}</p>
                </div>
              )}
              {answered && stepIndex === visible - 1 && visible < block.steps.length && (
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + 1)}
                  className="btn-ghost mt-3 !py-2 !text-xs"
                >
                  What happened next →
                </button>
              )}
            </li>
          )
        })}
      </ol>

      {done && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold text-white">
            {scoreFrom(choices)} of {block.steps.length} best calls
          </p>
          <button
            type="button"
            onClick={() => {
              setChoices({})
              setVisible(1)
            }}
            className="text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-glow"
          >
            Run it again
          </button>
        </div>
      )}
    </ExerciseFrame>
  )
}

// A sandbox, not a drill: there is no right answer to score, so nothing here
// is recorded. Its whole job is to make "text arrives as chunks" something you
// have seen happen to your own words.
function Tokeniser({ block }) {
  const [text, setText] = useState(block.initial)
  const tokens = approximateTokens(text)
  const chars = text.length

  return (
    <ExerciseFrame eyebrow="Try it" title={block.title} instruction={block.instruction}>
      <label className="block">
        <span className="sr-only">Text to tokenise</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="input !text-[13px]"
          placeholder="Type anything…"
        />
      </label>

      {block.presets?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {block.presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setText(preset.text)}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-glow/50 hover:text-white"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5" aria-live="polite">
        {tokens.map((token, i) => (
          <span
            key={i}
            className="rounded-md border border-cyan-glow/25 bg-cyan-glow/10 px-1.5 py-0.5 font-mono text-[12px] text-cyan-glow"
          >
            {/* Spaces and newlines are tokens too, and invisible ones teach
                nothing — so they are shown as marks. */}
            {token.replace(/ /g, '␣').replace(/\n/g, '⏎')}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/10 pt-3 text-xs text-slate-400">
        <span>
          <span className="font-semibold text-white">{tokens.length}</span> tokens
        </span>
        <span>
          <span className="font-semibold text-white">{chars}</span> characters
        </span>
        <span>
          <span className="font-semibold text-white">
            {tokens.length ? (chars / tokens.length).toFixed(1) : '0.0'}
          </span>{' '}
          characters per token
        </span>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
        An approximation, deliberately. Real tokenisers learn their vocabulary from data, so the exact splits differ by
        model and cannot be worked out from rules — but the behaviour shown here is real: a leading space belongs to
        the word after it, unusual words shatter, and digits go one at a time.
      </p>
    </ExerciseFrame>
  )
}

function ExerciseFooter({ marked, score, total, canSubmit, submitLabel, hint, onSubmit, onReset }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
      {marked ? (
        <>
          <p className="text-sm font-semibold text-white">
            {score} / {total} right
          </p>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-glow"
          >
            Try it again
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="btn-ghost !py-2.5 !text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLabel}
          </button>
          <span className="text-xs text-slate-500">{hint}</span>
        </>
      )}
    </div>
  )
}
