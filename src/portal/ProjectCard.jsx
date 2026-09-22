import { formatDate, managerLabel } from './data'
import { StatusBadge } from './ui'

// Shared by all three dashboards; `children` is where each role's controls go.
export default function ProjectCard({ project, showOwner = false, children }) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-lg font-600 text-white">{project.title}</h3>
        <StatusBadge status={project.status} />
      </div>

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-400">{project.summary}</p>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
        <div>
          <dt className="inline font-semibold uppercase tracking-wide">Budget</dt>{' '}
          <dd className="inline text-slate-300">{project.budget_range || '—'}</dd>
        </div>
        <div>
          <dt className="inline font-semibold uppercase tracking-wide">Timeline</dt>{' '}
          <dd className="inline text-slate-300">{project.timeline || '—'}</dd>
        </div>
        <div>
          <dt className="inline font-semibold uppercase tracking-wide">Posted</dt>{' '}
          <dd className="inline text-slate-300">{formatDate(project.created_at)}</dd>
        </div>
        {showOwner && (
          <div>
            <dt className="inline font-semibold uppercase tracking-wide">Owner</dt>{' '}
            <dd className="inline text-slate-300">{project.owner_id.slice(0, 8)}…</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-xs text-slate-500">
          <span className="font-semibold uppercase tracking-wide">AI Manager</span>{' '}
          <span className={project.assignment ? 'text-cyan-glow' : 'text-slate-400'}>
            {managerLabel(project.assignment?.manager)}
          </span>
        </p>
        {/* The manager's credentials, shown to whoever they were assigned to —
            otherwise merits are write-only and do nobody any good. */}
        {project.assignment?.manager?.certificates?.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {project.assignment.manager.certificates.map((c) => (
              <li key={c.url}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Verify this certificate"
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-cyan-glow/40 hover:text-cyan-glow"
                >
                  {c.name}
                  <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none">
                    <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        )}
        {project.assignment?.note && (
          <p className="mt-1.5 text-xs italic text-slate-500">“{project.assignment.note}”</p>
        )}
      </div>

      {children && <div className="mt-4 border-t border-white/10 pt-4">{children}</div>}
    </div>
  )
}
