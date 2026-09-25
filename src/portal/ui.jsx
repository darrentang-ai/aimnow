import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const STATUS_STYLES = {
  open: 'border-white/20 bg-white/10 text-slate-200',
  assigned: 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow',
  in_progress: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  completed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  cancelled: 'border-white/10 bg-white/5 text-slate-500',
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        STATUS_STYLES[status] ?? STATUS_STYLES.open
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

// Portal chrome. Deliberately plainer than the marketing navbar — this is a
// logged-in tool, not a pitch.
export function PortalShell({ email, role, onSignOut, children }) {
  return (
    <div className="min-h-screen bg-ink-900">
      <header className="border-b border-white/10 bg-ink-900/80 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="transition-opacity hover:opacity-80" aria-label="Back to aimnow.io">
              <Logo className="h-7 w-auto" />
            </Link>
            <span className="hidden text-sm font-semibold text-slate-400 sm:block">AI Manager Portal</span>
          </div>
          {email && (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-400 sm:block">
                {email}
                {role && <span className="ml-1.5 text-cyan-glow">· {role}</span>}
              </span>
              <button onClick={onSignOut} className="text-xs font-semibold text-slate-300 transition-colors hover:text-cyan-glow">
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="container-x py-10 md:py-14">{children}</main>
    </div>
  )
}

export function PageHead({ title, sub, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-700 text-white sm:text-3xl">{title}</h1>
        {sub && <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Empty({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-400">
      {children}
    </div>
  )
}

// Where a business goes once the free plan's one project is used up. The
// Enterprise plan is sold rather than self-served, so this lands on the contact
// form with that option already chosen — see lib/interest.js for why the
// interest travels as a query parameter rather than the usual event.
export const UPGRADE_HREF = '/?interest=enterprise#contact'

export function UpgradePrompt({ heading = 'You have used your free project' }) {
  return (
    <div className="rounded-2xl border border-cyan-glow/25 bg-gradient-to-b from-aim-blue/10 to-transparent p-8 text-center">
      <h2 className="font-display text-xl font-700 text-white">{heading}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
        A free account covers one project. To run several at once, talk to us about an Enterprise
        plan — multi-user accounts, API access and a dedicated contact.
      </p>
      <Link to={UPGRADE_HREF} className="btn-primary mt-6">
        Talk to us about Enterprise
      </Link>
    </div>
  )
}

export function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label} {required && <span className="text-cyan-glow">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export function Alert({ kind = 'error', children }) {
  const styles =
    kind === 'error'
      ? 'border-red-400/30 bg-red-400/10 text-red-300'
      : 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow'
  return (
    <p className={`rounded-xl border px-4 py-3 text-sm ${styles}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}
