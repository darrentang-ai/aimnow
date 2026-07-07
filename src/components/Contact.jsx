import { useState } from 'react'
import { Reveal, Eyebrow } from './ui'

const interests = ['Join the AI Manager Portal', 'Consultancy engagement', 'Become a trusted AI Manager', 'General enquiry']

// Web3Forms delivers submissions to the configured inbox (darren.tang@gmail.com).
// This access key is public by design and safe to ship in client code.
const WEB3FORMS_ACCESS_KEY = '8e889530-28a3-4589-ad7b-d5957f298073'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', company: '', interest: interests[0], message: '' })

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    // Honeypot: bots fill hidden fields — silently drop them.
    if (e.target.botcheck?.value) return

    setSending(true)
    setError('')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `New AIM NOW enquiry — ${form.interest}`,
          from_name: 'AIM NOW website',
          name: form.name,
          email: form.email,
          company: form.company || '—',
          interest: form.interest,
          message: form.message || '—',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
      } else {
        setError(data.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error — please try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="contact" className="relative py-20 md:py-28">
      <div className="container-x">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 shadow-glow-sm">
          <div className="grid lg:grid-cols-2">
            {/* Left — pitch */}
            <div className="relative flex flex-col justify-center p-8 md:p-12">
              <Reveal>
                <Eyebrow className="mb-4">Get started</Eyebrow>
                <h2 className="font-display text-3xl font-700 leading-tight text-white sm:text-4xl">
                  Ready to <span className="text-gradient">aim now</span>?
                </h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
                  Create a free Portal account, scope a consultancy engagement, or just ask a question.
                  We typically reply within one business day.
                </p>
              </Reveal>
            </div>

            {/* Right — form */}
            <div className="border-t border-white/10 bg-white/[0.02] p-8 md:border-l md:border-t-0 md:p-12">
              {sent ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-glow/15 ring-1 ring-cyan-glow/40">
                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-cyan-glow" fill="none">
                      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-700 text-white">Thanks, {form.name || 'there'}!</h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-400">
                    Your message is in. We'll be in touch within one business day.
                  </p>
                  <button onClick={() => setSent(false)} className="btn-ghost mt-6">
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Honeypot — hidden from users, catches bots */}
                  <input type="text" name="botcheck" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name" required>
                      <input required value={form.name} onChange={update('name')} className="input" placeholder="Jane Doe" />
                    </Field>
                    <Field label="Email" required>
                      <input required type="email" value={form.email} onChange={update('email')} className="input" placeholder="jane@company.com" />
                    </Field>
                  </div>
                  <Field label="Company">
                    <input value={form.company} onChange={update('company')} className="input" placeholder="Acme Ltd" />
                  </Field>
                  <Field label="I'm interested in">
                    <select value={form.interest} onChange={update('interest')} className="input">
                      {interests.map((o) => (
                        <option key={o} value={o} className="bg-ink-800">{o}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Message">
                    <textarea value={form.message} onChange={update('message')} rows={4} className="input resize-none" placeholder="Tell us what you're working on..." />
                  </Field>
                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sending ? 'Sending…' : 'Send message'}
                  </button>
                  {error && (
                    <p className="text-center text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  )}
                  <p className="text-center text-xs text-slate-500">
                    By submitting you agree to be contacted about your enquiry.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label} {required && <span className="text-cyan-glow">*</span>}
      </span>
      {children}
    </label>
  )
}
