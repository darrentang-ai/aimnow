import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Alert, Field, PageHead } from './ui'

const BUDGETS = ['Under €2,000', '€2,000 – €5,000', '€5,000 – €15,000', '€15,000+', 'Not sure yet']
const TIMELINES = ['As soon as possible', 'Within a month', 'This quarter', 'Just exploring']

export default function PostProject({ userId }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', summary: '', budget_range: BUDGETS[4], timeline: TIMELINES[1] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    // owner_id must match auth.uid() or the projects_insert_own policy rejects it.
    const { error } = await supabase.from('projects').insert({ ...form, owner_id: userId })
    setSaving(false)
    if (error) setError(error.message)
    else navigate('/portal')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHead
        title="Post a project"
        sub="Describe the outcome you need, not the technology. We'll scope it and match you with an AI Manager who has delivered similar work."
      />
      <form onSubmit={onSubmit} className="card space-y-5">
        <Field label="What do you need built?" required>
          <input
            required
            value={form.title}
            onChange={update('title')}
            className="input"
            placeholder="Automate our quote turnaround"
          />
        </Field>
        <Field
          label="A bit more detail"
          required
          hint="What happens today, what you'd like to happen instead, and anything that has to integrate."
        >
          <textarea
            required
            rows={6}
            value={form.summary}
            onChange={update('summary')}
            className="input resize-none"
            placeholder="Our team rekeys quote requests from email into our CRM by hand — roughly two hours a day…"
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Budget">
            <select value={form.budget_range} onChange={update('budget_range')} className="input">
              {BUDGETS.map((b) => (
                <option key={b} value={b} className="bg-ink-800">{b}</option>
              ))}
            </select>
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
