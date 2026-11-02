import { useMemo, useState } from 'react'
import { broadcastMessage } from './data'
import { Alert } from './ui'

// Audiences, and the counts beside them, are defined by `role` alone —
// exactly what broadcast_message() filters on in supabase/broadcast.sql. The
// People tab's Applicants filter is looser (it also counts a business whose
// sign-up said "manager"), and matching that here would show a number the send
// would not honour. A count on a confirmation has to be the real one.
const AUDIENCES = [
  ['all', 'Everyone'],
  ['business', 'Businesses'],
  ['manager', 'AI Managers'],
  ['applicant', 'Applicants'],
]

const LIMIT = 2000

// Sending to everyone at once is rare, irreversible and loud — it lights an
// unread badge on every dashboard. So it is folded away by default, it names
// the number of recipients before it will do anything, and it asks twice.
export default function Broadcast({ people, onSent }) {
  const [open, setOpen] = useState(false)
  const [audience, setAudience] = useState('all')
  const [body, setBody] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(null)

  const counts = useMemo(() => {
    const members = (people ?? []).filter((p) => p.role !== 'admin')
    return {
      all: members.length,
      business: members.filter((p) => p.role === 'business').length,
      manager: members.filter((p) => p.role === 'manager').length,
      applicant: members.filter((p) => p.role === 'applicant').length,
    }
  }, [people])

  const recipients = counts[audience] ?? 0
  const trimmed = body.trim()
  const tooLong = trimmed.length > LIMIT
  const ready = trimmed.length > 0 && !tooLong && recipients > 0

  const send = async () => {
    setBusy(true)
    setError('')
    const { sent: count, error } = await broadcastMessage({ body, audience })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    // The server's count, not the one on the button: the recipient set is
    // decided there, and roles may have changed since this screen loaded.
    setSent(count)
    setConfirming(false)
    setBody('')
    setOpen(false)
    // Their unread badges are now lit, and the admin's own list shows the
    // threads it just created.
    onSent?.()
  }

  if (!open) {
    return (
      <div className="mb-4">
        {sent !== null && (
          <div className="mb-3">
            <Alert kind="info">
              Sent to {sent} {sent === 1 ? 'person' : 'people'}. Replies arrive under the Unread filter.
            </Alert>
          </div>
        )}
        <button
          onClick={() => {
            setOpen(true)
            setSent(null)
          }}
          className="btn-ghost !py-2 !text-xs"
        >
          Message everyone
        </button>
      </div>
    )
  }

  return (
    <div className="mb-5 rounded-2xl border border-white/15 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-600 text-white">Message everyone</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            One message into each person's thread, from AIM Now. It appears on their dashboard and lights their
            unread badge.
          </p>
        </div>
        <button
          onClick={() => {
            setOpen(false)
            setConfirming(false)
            setError('')
          }}
          className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-300"
        >
          Close
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {AUDIENCES.map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setAudience(value)
              setConfirming(false)
            }}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              audience === value
                ? 'border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow'
                : 'border-white/15 bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            {label} <span className="text-slate-500">{counts[value] ?? 0}</span>
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value)
          setConfirming(false)
        }}
        rows={5}
        className="input mt-4 !text-sm"
        placeholder="What do you want to tell them?"
      />

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={tooLong ? 'text-red-300' : 'text-slate-500'}>
          {trimmed.length} / {LIMIT} characters
        </span>
        <span className="text-slate-500">
          {recipients} {recipients === 1 ? 'recipient' : 'recipients'}
        </span>
      </div>

      {/* Shown as they will see it. A broadcast is the one message nobody gets
          to re-read before it goes out, so the preview is not a nicety. */}
      {trimmed && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            How it will look on their dashboard
          </p>
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl bg-white/5 px-3.5 py-2 text-sm leading-relaxed text-slate-300 ring-1 ring-white/10">
              <p className="whitespace-pre-line">{trimmed}</p>
              <p className="mt-1 text-[10px] text-slate-500">AIM Now · just now</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
        {confirming ? (
          <>
            <button
              onClick={send}
              disabled={busy}
              className="btn-primary !py-2.5 !text-xs disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Sending…' : `Yes, send to ${recipients}`}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs font-semibold text-slate-400 transition-colors hover:text-slate-200"
            >
              Cancel
            </button>
            <span className="text-xs text-amber-300">This sends immediately and cannot be unsent.</span>
          </>
        ) : (
          <>
            <button
              onClick={() => setConfirming(true)}
              disabled={!ready}
              className="btn-ghost !py-2.5 !text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              Review and send
            </button>
            {tooLong && <span className="text-xs text-red-300">Too long by {trimmed.length - LIMIT}.</span>}
            {!tooLong && recipients === 0 && <span className="text-xs text-slate-500">Nobody in this group yet.</span>}
          </>
        )}
      </div>
    </div>
  )
}
