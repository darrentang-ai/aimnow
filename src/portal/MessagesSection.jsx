import { useCallback, useEffect, useState } from 'react'
import { countUnreadForPerson } from './data'
import Thread from './Thread'

// The person's side of the conversation, on both the business and the AI
// Manager dashboard. Collapsed by default so it doesn't push a dashboard's
// actual work down the page — unless something is unread, which is the one
// case where it should be the first thing seen.
export default function MessagesSection({ userId }) {
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  // Until the count lands we don't know whether to open it, and flipping it
  // open a moment after render would shove the page around.
  const [counted, setCounted] = useState(false)

  useEffect(() => {
    let cancelled = false
    countUnreadForPerson(userId).then(({ unread }) => {
      if (cancelled) return
      setUnread(unread)
      setOpen(unread > 0)
      setCounted(true)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const onRead = useCallback(() => setUnread(0), [])

  if (!counted) return null

  return (
    <section className="mt-12">
      <h2 className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-glow">
        Messages
        {unread > 0 && (
          <span className="rounded-full border border-cyan-glow/40 bg-cyan-glow/15 px-2 py-0.5 text-[10px] normal-case tracking-wide">
            {unread} new
          </span>
        )}
      </h2>
      <div className="card">
        {open ? (
          <Thread personId={userId} viewerId={userId} isAdmin={false} onRead={onRead} />
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-glow"
          >
            Message AIM Now
          </button>
        )}
      </div>
    </section>
  )
}
