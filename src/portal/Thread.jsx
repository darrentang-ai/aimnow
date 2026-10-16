import { useCallback, useEffect, useRef, useState } from 'react'
import { loadMessages, markMessagesRead, sendMessage } from './data'
import { Alert } from './ui'

// One conversation between AIM Now and one person. Both sides render this same
// component — the only difference is which way round "us" and "them" sit, which
// `isAdmin` decides. See the messages table in schema.sql for why a thread is
// identified by a person rather than by a thread row.
export default function Thread({ personId, viewerId, isAdmin, personName, onRead }) {
  const [messages, setMessages] = useState(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  // Held in a ref, not a dependency. Callers pass an inline arrow, so its
  // identity changes on every parent render — and since onRead itself makes
  // the parent re-render (it clears a badge), depending on it would refetch
  // the thread and mark it read all over again on the next tick.
  const onReadRef = useRef(onRead)
  onReadRef.current = onRead

  const refresh = useCallback(async () => {
    const { messages, error } = await loadMessages(personId)
    if (error) {
      setError(error.message)
      return
    }
    setMessages(messages)

    // Opening the thread is what counts as reading it. The function decides
    // which direction to clear from auth.uid(), so an admin reading doesn't
    // mark their own unanswered messages as read.
    const unreadFromThem = messages.some((m) => m.from_admin !== isAdmin && !m.read_at)
    if (unreadFromThem) {
      const { error: readError } = await markMessagesRead(personId)
      // A failure here is worth neither an alert nor a retry: the messages are
      // on screen, which is the part that mattered. The badge simply stays.
      if (!readError) onReadRef.current?.()
    }
  }, [personId, isAdmin])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Jump to the newest message, the way every other chat does.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')
    const { message, error } = await sendMessage({ personId, senderId: viewerId, body })
    setSending(false)
    if (error) {
      setError(error.message)
      return
    }
    // Append rather than refetch — one round trip is enough, and the insert
    // returned the row the database actually stored.
    setMessages((prev) => [...(prev ?? []), message])
    setBody('')
  }

  return (
    <div>
      {messages === null ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <p className="text-sm text-slate-500">
              {isAdmin
                ? 'No messages yet. Anything you send here lands on their dashboard.'
                : 'No messages yet. Anything AIM Now sends you will appear here.'}
            </p>
          )}
          {messages.map((m) => {
            // "Mine" is the side the viewer is on, not a fixed role.
            const mine = m.from_admin === isAdmin
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    mine
                      ? 'bg-cyan-glow/10 text-slate-200 ring-1 ring-cyan-glow/20'
                      : 'bg-white/5 text-slate-300 ring-1 ring-white/10'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.body}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {/* Admins answer as one AIM Now voice, so that's the name
                        on anything from that side, whoever typed it. The other
                        side is the person themselves — their own name reads as
                        "You" to them, and as who they are to an admin. */}
                    {m.from_admin ? 'AIM Now' : isAdmin ? personName || 'Them' : 'You'} ·{' '}
                    {new Date(m.created_at).toLocaleString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-3 space-y-2">
        <textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="input resize-none !py-2 !text-xs"
          placeholder={isAdmin ? 'Write to this person…' : 'Write to AIM Now…'}
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="btn-ghost !px-5 !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
      {error && (
        <div className="mt-2">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
  )
}
