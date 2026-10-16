import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { canInstall, promptInstall } from '../lib/pwaInstall'
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
  // /portal?as=manager preselects the AI Manager option, so a link that
  // promised "become an AI Manager" lands on a form already set to it.
  //
  // Otherwise this starts unset rather than defaulting to 'business': with a
  // default pre-selected, someone who wanted to become an AI Manager but
  // arrived at /portal generically (not via that link) could submit without
  // ever touching the field, signing up as a business by accident. Starting
  // blank forces an explicit choice from everyone.
  // 'manager_existing' and 'manager_apply' both record the same signup_as —
  // see isManagerIntent below — the split exists only so the option someone
  // picks matches how they think of themselves. ?as=manager always means
  // the latter: it's set by CTAs worded as "become" or "sign up", never by
  // anything aimed at an existing member.
  const [searchParams] = useSearchParams()
  const [signupAs, setSignupAs] = useState(searchParams.get('as') === 'manager' ? 'manager_apply' : '')
  const isManagerIntent = signupAs === 'manager_existing' || signupAs === 'manager_apply'
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [installOffered, setInstallOffered] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    // The select has a required, disabled placeholder, so a native submit
    // already can't reach here with signupAs unset — but belt and braces,
    // since signup_as's check constraint would otherwise reject an empty
    // string with a database error instead of this plain sentence.
    if (!signupAs) {
      setError('Choose whether you’re signing up as a business or an AI Manager.')
      return
    }
    // Mirrors the mandatory marker on the field below — this is the one that
    // actually stops the request, since a required attribute only guards a
    // real browser submit, not this handler.
    if (signupAs === 'business' && !company.trim()) {
      setError('Enter your company name.')
      return
    }
    setSending(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
        // Only applied when the auth user is first created; the
        // handle_new_user trigger copies these into the profile row. Note
        // signup_as lands in `signup_as`, never in `role` — this is metadata
        // the browser controls, so it states an intent rather than granting
        // anything. Both manager options collapse to the one value the check
        // constraint allows — see isManagerIntent above.
        data: { full_name: fullName, company, signup_as: isManagerIntent ? 'manager' : 'business' },
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

          {/* Best moment to offer the install: they have committed an email,
              and this screen is dead time while they switch to their mail app.
              An explicit button rather than firing prompt() from the submit
              handler — that runs after an awaited network call, by which point
              the transient user activation prompt() needs may have expired, so
              it would fail silently on a slow connection. A tap here is always
              a fresh gesture, and never spends the one-shot prompt uninvited. */}
          {canInstall() && !installOffered && (
            <button
              onClick={async () => {
                await promptInstall()
                setInstallOffered(true)
              }}
              className="btn-primary mt-6 !py-2.5 !text-xs"
            >
              Install the app
            </button>
          )}

          <button
            onClick={() => setSent(false)}
            className="mt-6 block w-full text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-glow"
          >
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
        {/* The pitch differs by who's arriving: a business wants the work done,
            an applying manager wants the work, a returning one just wants in.
            Neutral until something is chosen. */}
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {signupAs === 'manager_existing'
            ? "Welcome back — sign in to your AI Manager account. No password needed — we'll email you a link."
            : signupAs === 'manager_apply'
              ? "Join our network and get matched with businesses that need what you build. No password needed — we'll email you a link."
              : signupAs === 'business'
                ? "Post a project and we'll match it with a trusted AI Manager. No password needed — we'll email you a link."
                : "Post a project, or join as an AI Manager. No password needed — we'll email you a link."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* Recorded as an intent, not a role — see signup_as in schema.sql.
              An AI Manager is granted that role by an admin after their
              certificates are checked, so this can't be used to join the
              network by simply claiming to be in it. The certificate
              requirement itself isn't mentioned on this screen — it's in the
              FAQ instead — so someone deciding whether to even open this form
              isn't met with eligibility criteria before they've been told
              what signing up does. */}
          {/* A dropdown rather than the two-button toggle this replaced: a
              toggle needs a default, and defaulting to "A business" let
              someone who actually wanted to join as an AI Manager submit
              without ever touching the field — see the note on signupAs's
              initial state above. A select's own placeholder option makes
              "nothing chosen yet" a real, visible state, and `required` with
              a disabled placeholder stops a native submit from reaching
              onSubmit while it's showing. */}
          <Field label="I'm signing up as">
            <select
              required
              value={signupAs}
              onChange={(e) => {
                const value = e.target.value
                setSignupAs(value)
                // Company is hidden for managers, so drop anything already
                // typed — otherwise it would be submitted invisibly.
                if (value !== 'business') setCompany('')
              }}
              className="input"
            >
              <option value="" disabled className="bg-ink-800">
                Choose one…
              </option>
              <option value="business" className="bg-ink-800">
                A business — post a project
              </option>
              <option value="manager_existing" className="bg-ink-800">
                An AI Manager
              </option>
              <option value="manager_apply" className="bg-ink-800">
                Want to become an AI Manager
              </option>
            </select>
          </Field>
          <Field label="Email" required>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              // An AI Manager is an individual and may well use a personal
              // address, so don't imply a company domain.
              placeholder={isManagerIntent ? 'you@example.com' : 'you@company.com'}
            />
          </Field>
          <Field label="Your name" hint="Only used the first time you sign in.">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Jane Doe" />
          </Field>
          {/* An AI Manager joins as an individual, not on behalf of a company.
              Required rather than optional: a profile with no company and no
              name beyond "Jane Doe" would leave an admin no way to identify
              which business a project actually belongs to. */}
          {signupAs === 'business' && (
            <Field label="Company" required>
              <input
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="input"
                placeholder="Acme Ltd"
              />
            </Field>
          )}
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
