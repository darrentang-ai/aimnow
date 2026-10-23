import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { atProjectLimit, describeInsertError, loadProjects } from './data'
import { Alert, Field, PageHead, UpgradePrompt } from './ui'

const TIMELINES = ['As soon as possible', 'Within a month', 'This quarter', 'Just exploring']

// A slider instead of a dropdown of ranges: picking a point on a line is a
// smaller ask than mentally sorting yourself into a bucket, so fewer people
// bail out to "Not sure yet" by default. Steps are uneven on purpose — finer
// near the common end, coarser once "exact number" stops mattering.
const BUDGET_STEPS = [500, 1000, 2000, 3500, 5000, 7500, 10000, 15000, 25000, 50000]
const DEFAULT_BUDGET_INDEX = 4 // $5,000 — a plausible real project, not the floor or ceiling

// Clients post from the UK, Europe, North America, ANZ and APAC (see
// About.jsx) — a dollar sign alone is ambiguous across most of that list.
const CURRENCIES = ['USD', 'GBP', 'EUR', 'AUD', 'CAD']

function formatBudgetStep(index, currency) {
  const value = BUDGET_STEPS[index]
  const formatted = new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
  return index === BUDGET_STEPS.length - 1 ? `${formatted}+` : formatted
}

// What an AI Manager has to work out before they can scope anything. Posting
// a one-line brief isn't a failure of effort — most people don't know what a
// builder needs — so the questions are asked here rather than in a round of
// emails after assignment.
const PROMPTS = [
  ['What happens today', 'The manual process, the spreadsheet, the thing nobody does because it takes too long.'],
  ['What you want instead', 'The outcome, not the technology. "Members renew without us touching it", not "a Next.js app".'],
  ['Who will use it', 'Your team, your customers, or both — and roughly how many.'],
  ['What it has to work with', 'Existing tools and data it must connect to: your CRM, Stripe, a spreadsheet, an inbox.'],
  ['What "done" looks like', 'How you will know it worked. This is what the project gets measured against.'],
]

// Filled into the brief on request. Headings rather than prose, because a
// blank box is the hard part — most people can answer a question they can see.
const TEMPLATE = PROMPTS.map(([label]) => `${label}:\n`).join('\n')

// A real brief, in the shape the prompts ask for. Deliberately a membership
// portal: it's a whole system rather than one automation, so it shows what
// enough detail looks like when the work isn't a single task.
const EXAMPLE = `What happens today: We run a 400-member trade association. Members email us to renew, we check a spreadsheet, send an invoice by hand, then post out a certificate. It takes two of us about a day a week, and renewals still get missed.

What you want instead: A members' area where someone signs in, sees when their membership expires, renews and pays there, and downloads their certificate straight away.

Who will use it: Our 400 members, and three staff who need to see who has renewed and chase who hasn't.

What it has to work with: Stripe for payments, our existing Mailchimp list, and the member spreadsheet we'd want imported once at the start.

What "done" looks like: A member renews end to end without anyone here touching it, and we can see at a glance who is lapsing next month.`

// Sits above the brief rather than after it: guidance that arrives once
// someone has already typed something is guidance they will ignore.
function BriefGuide({ onUseTemplate, onUseExample, canFill }) {
  const [showExample, setShowExample] = useState(false)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-glow">
        What makes a brief easy to deliver
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        An AI Manager scopes the work from what you write here. Cover these five and they can start —
        miss them and the first week goes on questions instead of building.
      </p>
      <dl className="mt-4 space-y-2.5">
        {PROMPTS.map(([label, why]) => (
          <div key={label} className="text-xs leading-relaxed">
            <dt className="inline font-semibold text-slate-200">{label}.</dt>{' '}
            <dd className="inline text-slate-400">{why}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/5 pt-3">
        {/* Only offered while the brief is empty — a button that silently
            overwrites what someone has already written is worse than no
            button at all. */}
        {canFill && (
          <button
            type="button"
            onClick={onUseTemplate}
            className="text-xs font-semibold text-cyan-glow transition-colors hover:text-white"
          >
            Start from these headings
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowExample((v) => !v)}
          className="text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-glow"
        >
          {showExample ? 'Hide example' : 'See a worked example'}
        </button>
      </div>

      {showExample && (
        <div className="mt-3 rounded-xl border border-white/10 bg-ink-900/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Example — a membership portal
          </p>
          <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-400">{EXAMPLE}</p>
          {canFill && (
            <button
              type="button"
              onClick={onUseExample}
              className="mt-3 text-xs font-semibold text-cyan-glow transition-colors hover:text-white"
            >
              Use this as my starting point
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function PostProject({ userId, plan, role }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    summary: '',
    budget_range: formatBudgetStep(DEFAULT_BUDGET_INDEX, CURRENCIES[0]),
    timeline: TIMELINES[1],
  })
  const [budgetIndex, setBudgetIndex] = useState(DEFAULT_BUDGET_INDEX)
  const [budgetUnsure, setBudgetUnsure] = useState(false)
  const [currency, setCurrency] = useState(CURRENCIES[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // undefined until we know. The dashboard hides the button at the limit, but
  // /portal/new is a URL like any other, so the check belongs here too —
  // otherwise someone types it in, fills the form, and is refused at the end.
  const [limitReached, setLimitReached] = useState(role === 'admin' ? false : undefined)

  useEffect(() => {
    if (role === 'admin') return
    let cancelled = false
    loadProjects({ ownerId: userId }).then(({ projects, error }) => {
      if (cancelled) return
      // Failing open: a lookup error shouldn't block posting, and the trigger
      // is what actually enforces the limit either way.
      if (error) setLimitReached(false)
      else setLimitReached(atProjectLimit(plan, projects))
    })
    return () => {
      cancelled = true
    }
  }, [userId, plan, role])

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    // owner_id must match auth.uid() or the projects_insert_own policy rejects it.
    const { error } = await supabase.from('projects').insert({ ...form, owner_id: userId })
    setSaving(false)
    // enforce_project_limit() can still refuse this — another tab may have
    // posted since the check above — so translate that case rather than
    // showing the raw exception.
    if (error) setError(describeInsertError(error))
    else navigate('/portal')
  }

  if (limitReached === undefined) {
    return <p className="text-sm text-slate-400">Loading…</p>
  }

  if (limitReached) {
    return (
      <div className="mx-auto max-w-2xl">
        <UpgradePrompt />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHead
        title="Post a project"
        sub="Describe the outcome you need, not the technology. We'll scope it and match you with an AI Manager who has delivered similar work."
      />
      <form onSubmit={onSubmit} className="card space-y-5">
        <Field label="What do you need built?" required hint="A short name for the work — a title, not the whole brief.">
          <input
            required
            value={form.title}
            onChange={update('title')}
            className="input"
            placeholder="Members' area for our association"
          />
        </Field>

        <BriefGuide
          canFill={!form.summary.trim()}
          onUseTemplate={() => setForm((f) => ({ ...f, summary: TEMPLATE }))}
          onUseExample={() => setForm((f) => ({ ...f, summary: EXAMPLE }))}
        />

        <Field
          label="The brief"
          required
          hint="Write it however you like — the five above are what an AI Manager needs, not a form to fill in."
        >
          <textarea
            required
            rows={10}
            value={form.summary}
            onChange={update('summary')}
            className="input resize-y"
            placeholder="Our team rekeys quote requests from email into our CRM by hand — roughly two hours a day…"
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Budget">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <select
                  value={currency}
                  disabled={budgetUnsure}
                  onChange={(e) => {
                    const c = e.target.value
                    setCurrency(c)
                    setForm((f) => ({
                      ...f,
                      budget_range: budgetUnsure ? 'Not sure yet' : formatBudgetStep(budgetIndex, c),
                    }))
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-slate-300 outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c} className="bg-ink-800">{c}</option>
                  ))}
                </select>
                <span className="text-sm font-medium text-slate-200">
                  {budgetUnsure ? 'Not sure yet' : formatBudgetStep(budgetIndex, currency)}
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={budgetUnsure}
                  onChange={(e) => {
                    const unsure = e.target.checked
                    setBudgetUnsure(unsure)
                    setForm((f) => ({
                      ...f,
                      budget_range: unsure ? 'Not sure yet' : formatBudgetStep(budgetIndex, currency),
                    }))
                  }}
                  className="accent-cyan-glow"
                />
                Not sure yet
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={BUDGET_STEPS.length - 1}
              step={1}
              value={budgetIndex}
              disabled={budgetUnsure}
              onChange={(e) => {
                const i = Number(e.target.value)
                setBudgetIndex(i)
                setForm((f) => ({ ...f, budget_range: formatBudgetStep(i, currency) }))
              }}
              className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-glow disabled:cursor-not-allowed disabled:opacity-40"
            />
          </Field>
          <Field label="Timeline">
            <select value={form.timeline} onChange={update('timeline')} className="input">
              {TIMELINES.map((t) => (
                <option key={t} value={t} className="bg-ink-800">{t}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="btn-primary disabled:cursor-not-allowed disabled:opacity-70">
            {saving ? 'Posting…' : 'Post project'}
          </button>
          <button type="button" onClick={() => navigate('/portal')} className="btn-ghost">
            Cancel
          </button>
        </div>
        {error && <Alert>{error}</Alert>}
      </form>
    </div>
  )
}
