import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  approvedCount,
  assignProject,
  deletePerson,
  deleteProject,
  eligibleToAssign,
  formatDate,
  loadManagers,
  loadPeople,
  loadPersonImpact,
  loadProjects,
  loadUnreadByPerson,
  MIN_CERTIFICATES,
  PLAN_LABELS,
  PLANS,
  setCertificateApproval,
  setProfilePlan,
  setProfileRole,
  setProjectStatus,
} from './data'
import ProjectCard from './ProjectCard'
import Thread from './Thread'
import { Alert, Empty, PageHead } from './ui'

// 'applicant' sits next to 'business' deliberately: it is the state someone is
// in before you have checked anything, and moving them to 'manager' is the
// decision that puts them in front of businesses. See the user_role enum in
// schema.sql.
const ROLES = ['business', 'applicant', 'manager', 'admin']
const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000

const NEXT_STATUS = {
  assigned: [['in_progress', 'Mark in progress'], ['cancelled', 'Cancel']],
  in_progress: [['completed', 'Mark completed'], ['cancelled', 'Cancel']],
  open: [['cancelled', 'Cancel']],
}

// Someone who asked to join the network, by either route — see the badge in
// PersonRow for why there are two.
const isApplicant = (p) =>
  p.role === 'applicant' || (p.signup_as === 'manager' && p.role === 'business')

const PEOPLE_FILTERS = [
  ['all', 'Everyone'],
  ['applicants', 'Applicants'],
  ['unread', 'Unread'],
  ['manager', 'Managers'],
  ['business', 'Businesses'],
  // Who has actually used the Portal, as opposed to signing up and stopping.
  // Derived from the projects already loaded for the queue above, so it costs
  // no extra query.
  ['posted', 'With projects'],
]

function matchesPerson(person, needle) {
  if (!needle) return true
  return [person.full_name, person.email, person.company]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(needle))
}

function matchesProject(project, needle) {
  if (!needle) return true
  return [project.title, project.summary, project.owner?.full_name, project.owner?.company, project.owner?.email]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(needle))
}

function SearchBox({ value, onChange, placeholder, resultCount, total }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[14rem] flex-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input !py-2 !pl-9 !text-xs"
          placeholder={placeholder}
          // type="search" gives browsers their own clear button, which saves
          // building one and matches what people already expect from a filter.
          type="search"
        />
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      {value && (
        <span className="text-xs text-slate-500">
          {resultCount} of {total}
        </span>
      )}
    </div>
  )
}

function AssignControls({ project, managers, viewerId, onDone, onThreadRead }) {
  const [managerId, setManagerId] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [messaging, setMessaging] = useState(false)

  const run = async (fn) => {
    setBusy(true)
    setError('')
    const { error } = await fn()
    setBusy(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
          className="input !w-auto min-w-[12rem] flex-1 !py-2 !text-xs"
        >
          <option value="" className="bg-ink-800">
            {project.assignment ? 'Reassign to…' : 'Assign to…'}
          </option>
          {managers.map((m) => {
            const approved = approvedCount(m.certificates)
            const eligible = eligibleToAssign(m)
            return (
              <option key={m.id} value={m.id} disabled={!eligible} className="bg-ink-800">
                {m.full_name ?? m.id.slice(0, 8)}
                {m.company ? ` · ${m.company}` : ''}
                {eligible ? '' : ` — needs ${MIN_CERTIFICATES} approved certificates (has ${approved})`}
              </option>
            )
          })}
        </select>
        <button
          disabled={!managerId || busy}
          onClick={() => run(() => assignProject({ projectId: project.id, managerId, note }))}
          className="btn-primary !px-5 !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Saving…' : project.assignment ? 'Reassign' : 'Assign'}
        </button>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="input !py-2 !text-xs"
        placeholder="Note for the manager (optional)"
      />
      <div className="flex flex-wrap gap-2">
        {(NEXT_STATUS[project.status] ?? []).map(([status, label]) => (
          <button
            key={status}
            disabled={busy}
            onClick={() => run(() => setProjectStatus(project.id, status))}
            className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-glow/50 hover:text-cyan-glow disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>

      {/* The conversation opens here rather than sending you to the People tab,
          because what you need while writing to a business about their project
          is the brief, still on screen above. Looking up their record is the
          separate job the owner name does. */}
      <div className="border-t border-white/10 pt-3">
        <button
          onClick={() => setMessaging((v) => !v)}
          className="text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-glow"
        >
          {messaging ? 'Hide conversation' : 'Message the owner'}
        </button>
        {/* Mounted only once opened, so a queue of project cards isn't a
            queue of threads all fetching at once. */}
        {messaging && (
          <div className="mt-3">
            <Thread
              personId={project.owner_id}
              viewerId={viewerId}
              isAdmin
              personName={project.owner?.full_name || project.owner?.email}
              onRead={() => onThreadRead?.(project.owner_id)}
            />
          </div>
        )}
      </div>

      {/* Deliberately the quietest control here: Cancel keeps the record and is
          the right action for a real project, so it stays the obvious one.
          Two-step rather than window.confirm, which some embedded browsers
          suppress outright — a suppressed dialog would delete without asking. */}
      <div className="border-t border-white/10 pt-3">
        {confirmingDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Delete permanently? This cannot be undone.</span>
            <button
              disabled={busy}
              onClick={() => run(() => deleteProject(project.id))}
              className="rounded-full border border-red-400/40 bg-red-400/10 px-3.5 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-400/20 disabled:opacity-50"
            >
              {busy ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-glow"
            >
              Keep it
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-xs font-semibold text-slate-500 transition-colors hover:text-red-300"
          >
            Delete project
          </button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}
    </div>
  )
}

// `open` is owned by People rather than held here, because the list needs to
// know what is open to avoid filtering it away — see visible() below.
function PersonRow({ person, isSelf, viewerId, unread = 0, open, onToggle, onDone, onThreadRead }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // null until the confirmation is opened — the counts are fetched then, so a
  // list of eighty rows doesn't ask the database what deleting each would cost.
  const [impact, setImpact] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const isNew = Date.now() - new Date(person.created_at).getTime() < NEW_FOR_MS

  const certificates = person.certificates ?? []
  const personalProjects = person.personal_projects ?? []

  const change = async (role) => {
    setBusy(true)
    setError('')
    const { error } = await setProfileRole(person.id, role)
    setBusy(false)
    if (error) setError(error.message)
    else onDone()
  }

  const changePlan = async (plan) => {
    setBusy(true)
    setError('')
    const { error } = await setProfilePlan(person.id, plan)
    setBusy(false)
    if (error) setError(error.message)
    else onDone()
  }

  const approve = async (url, approved) => {
    setBusy(true)
    setError('')
    const { error } = await setCertificateApproval(person.id, url, approved)
    setBusy(false)
    if (error) setError(error.message)
    else onDone()
  }

  const askToDelete = async () => {
    setConfirmingDelete(true)
    setError('')
    const { impact, error } = await loadPersonImpact(person.id)
    // A failed lookup shouldn't block the delete — the confirmation just has
    // to be vaguer about what goes, and the function checks permission again
    // anyway.
    if (error) setImpact(null)
    else setImpact(impact)
  }

  const confirmDelete = async () => {
    setBusy(true)
    setError('')
    const { error } = await deletePerson(person.id)
    setBusy(false)
    if (error) {
      setError(error.message)
      setConfirmingDelete(false)
      return
    }
    // The row is gone, so there is nothing to update — reload the list.
    onDone()
  }

  // What's behind the disclosure, said in one line, so opening a row is never
  // a guess.
  const summary = [
    certificates.length &&
      `${approvedCount(certificates)}/${certificates.length} certificate${certificates.length === 1 ? '' : 's'} approved`,
    personalProjects.length && `${personalProjects.length} personal project${personalProjects.length === 1 ? '' : 's'}`,
  ].filter(Boolean)

  return (
    <li className="border-t border-white/10 py-3 first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Only the identity block toggles. The role and plan selects sit
            outside it — a click meant for a dropdown must never also collapse
            the row out from under it. */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="group min-w-0 flex-1 text-left"
        >
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
            <svg
              viewBox="0 0 24 24"
              className={`h-3 w-3 shrink-0 text-slate-500 transition-transform group-hover:text-cyan-glow ${open ? 'rotate-90' : ''}`}
              fill="none"
            >
              <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="truncate group-hover:text-cyan-glow">{person.full_name || 'No name given'}</span>
            {isNew && (
              <span className="shrink-0 rounded-full border border-cyan-glow/30 bg-cyan-glow/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-glow">
                New
              </span>
            )}
            {/* The application queue. Two ways in, because signup_as only
                records what someone picked at the time: new applicants arrive as
                'applicant', and anyone you move there by hand — someone who
                picked "a business" by mistake, or signed up before the option
                existed — shows up the same way. */}
            {isApplicant(person) && (
              <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                {person.role === 'applicant'
                  ? `Applicant · ${approvedCount(certificates)}/${MIN_CERTIFICATES} approved`
                  : 'Applied as manager'}
              </span>
            )}
            {/* Somebody is waiting on a reply. Counts only their messages, so it
                never lights up for an admin's own unanswered one. */}
            {unread > 0 && (
              <span className="shrink-0 rounded-full border border-cyan-glow/40 bg-cyan-glow/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-glow">
                {unread} new {unread === 1 ? 'message' : 'messages'}
              </span>
            )}
          </p>
          {/* Email is the only thing that tells two people with the same name
              apart, so it sits directly under it. Absent on the fallback path. */}
          {person.email && <p className="truncate pl-5 text-xs text-slate-400">{person.email}</p>}
          <p className="truncate pl-5 text-xs text-slate-500">
            {person.company || '—'} · joined {formatDate(person.created_at)}
            {summary.length > 0 && <span className="text-slate-600"> · {summary.join(' · ')}</span>}
          </p>
        </button>

        {/* Changing your own role here would drop your admin rights with no way
            back in the UI, so your own row is read-only. */}
        {isSelf ? (
          <span className="text-xs font-semibold text-slate-400">{person.role} · you</span>
        ) : (
          <select
            value={person.role}
            disabled={busy}
            onChange={(e) => change(e.target.value)}
            className="input !w-auto !py-1.5 !text-xs disabled:opacity-50"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="bg-ink-800">
                {r}
              </option>
            ))}
          </select>
        )}

        {/* The plan is what the project limit is read from — free is one project,
            anything else is unlimited. Only shown for businesses, since managers
            and admins post nothing and are never limited. */}
        {person.role === 'business' && (
          <select
            value={person.plan ?? 'free'}
            disabled={busy}
            onChange={(e) => changePlan(e.target.value)}
            title="Plan — free is capped at one project"
            className="input !w-auto !py-1.5 !text-xs disabled:opacity-50"
          >
            {PLANS.map((p) => (
              <option key={p} value={p} className="bg-ink-800">
                {PLAN_LABELS[p]}
              </option>
            ))}
          </select>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3 pl-5">
          {/* Approval is what makes "verified" mean anything, and it can only be
              done by a person opening the link — nothing automated can confirm a
              credential exists. */}
          {certificates.length > 0 && (
            <ul className="space-y-1.5 border-t border-white/5 pt-2.5">
              {certificates.map((c) => (
                <li key={c.url} className="flex flex-wrap items-center gap-2">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 text-xs text-slate-300 transition-colors hover:text-cyan-glow"
                  >
                    <span className="truncate">{c.name}</span>
                    <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none">
                      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  <button
                    disabled={busy}
                    onClick={() => approve(c.url, !c.approved)}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-50 ${
                      c.approved
                        ? 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow hover:border-white/20 hover:text-white'
                        : 'border-white/15 bg-white/5 text-slate-400 hover:border-cyan-glow/40 hover:text-cyan-glow'
                    }`}
                  >
                    {c.approved ? 'Approved' : 'Approve'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Self-reported, so presented more quietly than the certificates above
              and labelled — there is nothing to verify these against. Useful when
              deciding who to assign, which is why they are here at all. */}
          {personalProjects.length > 0 && (
            <div className="border-t border-white/5 pt-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Personal projects · self-reported
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {personalProjects.map((p, i) => (
                  <li key={`${p.title}-${i}`} className="text-xs">
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-slate-300 transition-colors hover:text-cyan-glow"
                      >
                        {p.title}
                        <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none">
                          <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    ) : (
                      <span className="font-semibold text-slate-300">{p.title}</span>
                    )}
                    {p.summary && <p className="mt-0.5 leading-relaxed text-slate-500">{p.summary}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Messaging your own row would be talking to yourself — and the thread
              model has no second side for it, since person_id would equal the
              admin sending. The thread only mounts once the row is open, so a
              long People list isn't eighty threads loading at once. */}
          {!isSelf && (
            <div className="border-t border-white/5 pt-2.5">
              <Thread
                personId={person.id}
                viewerId={viewerId}
                isAdmin
                personName={person.full_name || person.email}
                onRead={onThreadRead}
              />
            </div>
          )}

          {/* Inside the disclosure on purpose: deleting someone shouldn't be
              one stray click away while scanning the list. Your own row has no
              delete at all — admin_delete_person refuses it too, but the
              screen shouldn't offer what the database will reject. */}
          {!isSelf && (
            <div className="border-t border-white/5 pt-2.5">
              {confirmingDelete ? (
                <div className="space-y-2">
                  <p className="text-xs leading-relaxed text-slate-400">
                    Delete <span className="font-semibold text-white">{person.full_name || person.email}</span>{' '}
                    and everything attached?
                    {impact && (
                      <>
                        {' '}
                        That is{' '}
                        <span className="text-red-300">
                          {impact.projects} {impact.projects === 1 ? 'project' : 'projects'}, {impact.messages}{' '}
                          {impact.messages === 1 ? 'message' : 'messages'} and {impact.assignments}{' '}
                          {impact.assignments === 1 ? 'assignment' : 'assignments'}
                        </span>
                        .
                      </>
                    )}{' '}
                    This cannot be undone. It does not stop the same email signing up again.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      disabled={busy}
                      onClick={confirmDelete}
                      className="rounded-full border border-red-400/40 bg-red-400/10 px-3.5 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-400/20 disabled:opacity-50"
                    >
                      {busy ? 'Deleting…' : 'Yes, delete this person'}
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-glow"
                    >
                      Keep them
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={askToDelete}
                  className="text-xs font-semibold text-slate-500 transition-colors hover:text-red-300"
                >
                  Delete person
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2">
          <Alert>{error}</Alert>
        </div>
      )}
    </li>
  )
}

// Answers "has anyone signed up?" without a trip to the SQL editor, and makes
// promoting an AI Manager a UI action rather than a hand-written UPDATE.
//
// Data comes from the dashboard above rather than being loaded here: the
// worklist at the top of the page counts across people AND projects, so one
// owner of both is simpler than two components reporting upward.
function People({
  people,
  unreadByPerson,
  projectOwnerIds,
  currentUserId,
  filter,
  onFilter,
  query,
  onQuery,
  onChanged,
  onThreadRead,
}) {
  // Rows the admin currently has open. Collapsed by default — with 80-odd
  // people, a row rendering its certificates, personal projects and a message
  // thread inline means four fit on screen.
  const [openIds, setOpenIds] = useState(() => new Set())

  const toggleOpen = useCallback((id) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matchesFilter = (p) => {
      if (filter === 'all') return true
      if (filter === 'applicants') return isApplicant(p)
      if (filter === 'unread') return (unreadByPerson[p.id] ?? 0) > 0
      if (filter === 'posted') return projectOwnerIds.has(p.id)
      return p.role === filter
    }
    return (people ?? []).filter((p) => {
      if (!matchesPerson(p, needle)) return false
      // An open row stays, even once it stops matching. Acting on someone is
      // what changes whether they match: reading their messages clears the
      // unread badge, granting a role takes them out of Applicants. Without
      // this the row vanishes mid-read — on the last match, leaving an empty
      // list and no way back to what you were looking at.
      //
      // Search is not exempted: typing a new query is asking for something
      // else, where dropping the old row is the point.
      return matchesFilter(p) || openIds.has(p.id)
    })
  }, [people, unreadByPerson, projectOwnerIds, filter, query, openIds])

  const counts = useMemo(() => {
    const all = people ?? []
    return {
      all: all.length,
      applicants: all.filter(isApplicant).length,
      unread: all.filter((p) => (unreadByPerson[p.id] ?? 0) > 0).length,
      manager: all.filter((p) => p.role === 'manager').length,
      business: all.filter((p) => p.role === 'business').length,
      posted: all.filter((p) => projectOwnerIds.has(p.id)).length,
    }
  }, [people, unreadByPerson, projectOwnerIds])

  const newCount = (people ?? []).filter(
    (p) => Date.now() - new Date(p.created_at).getTime() < NEW_FOR_MS
  ).length

  return (
    <section id="people" className="mb-10">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-glow">
        People <span className="text-slate-500">({people?.length ?? 0})</span>
        {newCount > 0 && <span className="ml-2 normal-case tracking-normal text-slate-400">{newCount} new this week</span>}
      </h2>

      {people?.length > 0 && (
        <>
          <SearchBox
            value={query}
            onChange={onQuery}
            placeholder="Search by name, email or company…"
            resultCount={visible.length}
            total={people.length}
          />
          <div className="mb-4 flex flex-wrap gap-2">
            {PEOPLE_FILTERS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => onFilter(value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  filter === value
                    ? 'border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200'
                }`}
              >
                {label} <span className="text-slate-600">{counts[value] ?? 0}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {people === null && <p className="text-sm text-slate-400">Loading…</p>}
      {people?.length === 0 && <Empty>Nobody has signed up yet.</Empty>}
      {people?.length > 0 && visible.length === 0 && (
        <Empty>Nobody matches that. Try a different search, or switch filter.</Empty>
      )}
      {visible.length > 0 && (
        <div className="card">
          <ul>
            {visible.map((p) => (
              <PersonRow
                key={p.id}
                person={p}
                isSelf={p.id === currentUserId}
                viewerId={currentUserId}
                unread={unreadByPerson[p.id] ?? 0}
                open={openIds.has(p.id)}
                onToggle={() => toggleOpen(p.id)}
                onDone={onChanged}
                onThreadRead={() => onThreadRead(p.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// What is actually waiting on an admin, in one place. The three signals used to
// live in three different sections, so working out whether there was anything
// to do meant scrolling the whole page.
// Each chip switches to the tab that answers it. No scrolling any more: the
// tab content starts directly below, so changing tab IS the navigation.
function Worklist({ applicants, unread, awaiting, onShowApplicants, onShowUnread, onShowAwaiting }) {
  const items = [
    applicants > 0 && {
      key: 'applicants',
      label: `${applicants} ${applicants === 1 ? 'applicant' : 'applicants'} to review`,
      tone: 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20',
      onClick: onShowApplicants,
    },
    unread > 0 && {
      key: 'unread',
      label: `${unread} ${unread === 1 ? 'conversation' : 'conversations'} waiting on a reply`,
      tone: 'border-cyan-glow/40 bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20',
      onClick: onShowUnread,
    },
    awaiting > 0 && {
      key: 'awaiting',
      label: `${awaiting} ${awaiting === 1 ? 'project' : 'projects'} awaiting assignment`,
      tone: 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10',
      onClick: onShowAwaiting,
    },
  ].filter(Boolean)

  if (items.length === 0) return null

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={item.onClick}
          className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${item.tone}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function Tabs({ tab, onTab, projectCount, peopleCount }) {
  return (
    <div className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-px">
      {[
        ['projects', 'Projects', projectCount],
        ['people', 'People', peopleCount],
      ].map(([value, label, count]) => (
        <button
          key={value}
          onClick={() => onTab(value)}
          aria-current={tab === value ? 'page' : undefined}
          className={`-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === value
              ? 'border-cyan-glow text-cyan-glow'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {label} <span className="text-slate-600">{count}</span>
        </button>
      ))}
    </div>
  )
}

export default function AdminDashboard({ userId }) {
  const [projects, setProjects] = useState(null)
  const [managers, setManagers] = useState([])
  const [people, setPeople] = useState(null)
  const [unreadByPerson, setUnreadByPerson] = useState({})
  const [error, setError] = useState('')
  const [tab, setTab] = useState('projects')
  const [peopleFilter, setPeopleFilter] = useState('all')
  const [peopleQuery, setPeopleQuery] = useState('')
  const [projectQuery, setProjectQuery] = useState('')
  // Closed only ever grows, and it's the group you almost never need. Kept out
  // of the way rather than rendered in full every time the page loads.
  const [showClosed, setShowClosed] = useState(false)

  const refresh = useCallback(async () => {
    const [proj, mgr, ppl, unread] = await Promise.all([
      loadProjects(),
      loadManagers(),
      loadPeople(),
      // Deliberately unchecked: an unlit badge is a far smaller problem than
      // refusing to render the whole dashboard over it.
      loadUnreadByPerson(),
    ])
    const failure = proj.error ?? mgr.error ?? ppl.error
    setError(failure ? failure.message : '')
    // Set each only on its own success, so one failing call doesn't blank a
    // section that loaded perfectly well.
    if (!proj.error) setProjects(proj.projects)
    if (!mgr.error) setManagers(mgr.managers)
    if (!ppl.error) setPeople(ppl.people)
    setUnreadByPerson(unread.unreadByPerson)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Clearing a badge shouldn't reload everything and collapse the thread being
  // read, so it only touches the count it knows changed. Returning prev
  // unchanged when it's already clear avoids a re-render for nothing.
  const clearUnread = useCallback((personId) => {
    setUnreadByPerson((prev) => (prev[personId] ? { ...prev, [personId]: 0 } : prev))
  }, [])

  // Memoised so its identity is stable: People filters on it inside a useMemo,
  // and a fresh Set every render would recompute that list for nothing.
  // Built from every project regardless of status — someone who posted and
  // then cancelled has still used the Portal.
  const projectOwnerIds = useMemo(
    () => new Set((projects ?? []).map((p) => p.owner_id)),
    [projects]
  )

  const needle = projectQuery.trim().toLowerCase()
  const matching = (projects ?? []).filter((p) => matchesProject(p, needle))

  const open = matching.filter((p) => p.status === 'open')
  const live = matching.filter((p) => ['assigned', 'in_progress'].includes(p.status))
  const closed = matching.filter((p) => ['completed', 'cancelled'].includes(p.status))

  const applicantCount = (people ?? []).filter(isApplicant).length
  const unreadCount = Object.values(unreadByPerson).filter((n) => n > 0).length
  // From the unfiltered list: a search shouldn't change what's waiting on you.
  const awaitingCount = (projects ?? []).filter((p) => p.status === 'open').length

  // Looking someone up from a project card: the People tab, searched to them.
  // Email rather than name because two people can share a name — and in this
  // data several do.
  const showPerson = (project) => {
    setTab('people')
    setPeopleFilter('all')
    setPeopleQuery(project.owner?.email || project.owner?.full_name || '')
  }

  const projectGroup = (label, list) => (
    <section key={label} className="mb-10">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-glow">
        {label} <span className="text-slate-500">({list.length})</span>
      </h2>
      {list.length === 0 ? (
        <Empty>{needle ? 'Nothing here matches that search.' : 'Nothing here.'}</Empty>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} showOwner onOwnerClick={showPerson}>
              <AssignControls
                project={p}
                managers={managers}
                viewerId={userId}
                onDone={refresh}
                onThreadRead={clearUnread}
              />
            </ProjectCard>
          ))}
        </div>
      )}
    </section>
  )

  return (
    <>
      {/* One title over both tabs, since the tab labels say which is which. */}
      <PageHead
        title="Admin"
        sub="Assign work, review applicants, and answer anyone waiting on a reply."
      />
      {error && <Alert>{error}</Alert>}
      {!error && projects === null && <p className="text-sm text-slate-400">Loading…</p>}

      {/* Above the tabs rather than inside one: it's what tells you which tab
          to be on, so it can't live in either. */}
      {projects !== null && (
        <Worklist
          applicants={applicantCount}
          unread={unreadCount}
          awaiting={awaitingCount}
          onShowApplicants={() => {
            setTab('people')
            setPeopleFilter('applicants')
            setPeopleQuery('')
          }}
          onShowUnread={() => {
            setTab('people')
            setPeopleFilter('unread')
            setPeopleQuery('')
          }}
          onShowAwaiting={() => setTab('projects')}
        />
      )}

      {projects !== null && (
        <Tabs
          tab={tab}
          onTab={setTab}
          projectCount={projects.length}
          peopleCount={people?.length ?? 0}
        />
      )}

      {projects !== null && tab === 'projects' && (
        <>
          {managers.length === 0 && (
            <div className="mb-8">
              <Alert kind="info">
                No AI Managers yet. Someone has to apply and have two certificates approved before they
                can be assigned — set a person's role to <code className="text-xs">manager</code> on the
                People tab once you've checked their links.
              </Alert>
            </div>
          )}

          {projects.length > 0 && (
            <SearchBox
              value={projectQuery}
              onChange={setProjectQuery}
              placeholder="Search projects by title, detail or who posted it…"
              resultCount={matching.length}
              total={projects.length}
            />
          )}

          {projectGroup('Awaiting assignment', open)}
          {projectGroup('Live', live)}

          {/* Closed is behind a toggle, not hidden: the count is on the button,
              so a search that only matches closed projects still tells you they
              are in there rather than looking like no results. */}
          {showClosed ? (
            <>
              {projectGroup('Closed', closed)}
              <button
                onClick={() => setShowClosed(false)}
                className="text-xs font-semibold text-slate-500 transition-colors hover:text-cyan-glow"
              >
                Hide closed
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowClosed(true)}
              className="text-xs font-semibold text-slate-500 transition-colors hover:text-cyan-glow"
            >
              Show closed ({closed.length})
            </button>
          )}
        </>
      )}

      {projects !== null && tab === 'people' && (
        <People
          people={people}
          unreadByPerson={unreadByPerson}
          projectOwnerIds={projectOwnerIds}
          currentUserId={userId}
          filter={peopleFilter}
          onFilter={setPeopleFilter}
          query={peopleQuery}
          onQuery={setPeopleQuery}
          onChanged={refresh}
          onThreadRead={clearUnread}
        />
      )}
    </>
  )
}
