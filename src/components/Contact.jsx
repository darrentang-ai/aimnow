import { useState } from 'react'
import { Reveal } from './ui'

const interests = ['Join the AI Manager Portal', 'Consultancy engagement', 'Become a vetted engineer', 'General enquiry']

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', interest: interests[0], message: '' })

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = (e) => {
    e.preventDefault()
    // No backend wired yet — surface a success state and log the payload.
    // Swap this for a real endpoint (e.g. /api/lead) when available.
    console.log('Lead submitted:', form)
    setSent(true)
  }

  return (
    <section id="contact" className="relative py-20 md:py-28">
      <div className="container-x">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 shadow-glow-sm">
          <div className="grid lg:grid-cols-2">
            {/* Left — pitch */}
            <div className="relative p-8 md:p-12">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-aim-blue/20 blur-[100px]" />
              <Reveal>
                <span className="chip mb-4">Get started</span>
                <h2 className="font-display text-3xl font-700 leading-tight text-white sm:text-4xl">
                  Ready to <span className="text-gradient">aim now</span>?
                </h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
                  Create a free Portal account, scope a consultancy engagement, or just ask a question.
                  We typically reply within one business day.
                </p>

                <div className="mt-8 space-y-4 text-sm">
                  <a href="mailto:hello@aimnow.ai" className="flex items-center gap-3 text-slate-300 transition-colors hover:text-cyan-glow">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-glow/10 ring-1 ring-cyan-glow/30">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-cyan-glow" fill="none">
                        <path d="M4 4h16v16H4zM4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    hello@aimnow.ai
                  </a>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-glow/10 ring-1 ring-cyan-glow/30">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-cyan-glow" fill="none">
                        <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                    UK · EU · NA · ANZ · APAC
                  </div>
                </div>
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
                  <button type="submit" className="btn-primary w-full">
                    Send message
                  </button>
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
