import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Alert, Field } from './ui'

// Local-only escape hatch. Supabase's built-in mailer allows a handful of
// magic links per hour, which is unusable while testing the three roles.
//
// import.meta.env.DEV is false under `vite build`, so this whole component is
// dropped from the production bundle — it cannot be reached on a deployed site
// even if someone knows it exists. Create the test users in the Supabase
// dashboard (Authentication → Users → Add user, with Auto Confirm ticked) so
// no email is sent at all.
function DevPasswordSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(error.message)
    // On success the onAuthStateChange listener in PortalApp takes over.
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-dashed border-amber-400/40 bg-amber-400/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Local testing only</p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        Not included in production builds. Add users under Authentication → Users with “Auto Confirm”
        so no email is sent.
      </p>
      <div className="mt-4 space-y-3">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input !py-2.5 !text-xs"
          placeholder="Email"
          autoComplete="off"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input !py-2.5 !text-xs"
          placeholder="Password"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={busy}
          className="btn-ghost w-full !py-2.5 !text-xs disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? 'Signing in…' : 'Sign in with password'}
        </button>
        {error && <Alert>{error}</Alert>}
      </div>
    </form>
  )
}

// Passwordless on purpose: no password storage, no reset flow, no "forgot"
// screen to build or support.
export default function SignIn() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
        // Only applied when the auth user is first created; the
        // handle_new_user trigger copies these into the profile row.
        data: { full_name: fullName, company },
      },
    })
    setSending(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-glow/15 ring-1 ring-cyan-glow/40">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-cyan-glow" fill="none">
              <path d="M3 8l9 6 9-6M3 6h18v12H3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-5 font-display text-xl font-700 text-white">Check your inbox</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            We sent a sign-in link to <span className="text-slate-200">{email}</span>. It expires after an hour.
          </p>
          <button onClick={() => setSent(false)} className="btn-ghost mt-6 !py-2.5 !text-xs">
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="font-display text-2xl font-700 text-white">Sign in to the Portal</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Post a project and we'll match it with a trusted AI Manager. No password needed — we'll email
          you a link.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Work email" required>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@company.com"
            />
          </Field>
          <Field label="Your name" hint="Only used the first time you sign in.">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Jane Doe" />
          </Field>
          <Field label="Company">
            <input value={company} onChange={(e) => setCompany(e.target.value)} className="input" placeholder="Acme Ltd" />
          </Field>
          <button type="submit" disabled={sending} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70">
            {sending ? 'Sending…' : 'Email me a sign-in link'}
          </button>
          {error && <Alert>{error}</Alert>}
        </form>
        {import.meta.env.DEV && <DevPasswordSignIn />}
      </div>
    </div>
  )
}
