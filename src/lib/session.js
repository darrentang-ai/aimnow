// Is there a Supabase session, WITHOUT loading the Supabase client?
//
// The marketing page deliberately doesn't ship that client — it is ~245KB and
// only /portal needs it — so importing it here just to change a button label
// would undo the code splitting. Reading the stored token costs nothing.
//
// This is presentational only. It trusts the stored expiry rather than
// verifying the token, so it must never gate access to anything: the portal
// re-checks the real session, and row-level security is what actually protects
// the data.
const ref = import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]

export function hasSession() {
  if (!ref || typeof window === 'undefined') return false
  try {
    // Key format is a supabase-js implementation detail; if it ever changes,
    // this quietly returns false and the button reads "Sign in" as before.
    const raw = window.localStorage.getItem(`sb-${ref}-auth-token`)
    if (!raw) return false
    const { expires_at } = JSON.parse(raw)
    return typeof expires_at === 'number' && expires_at * 1000 > Date.now()
  } catch {
    // Private mode, blocked storage, or an unexpected shape.
    return false
  }
}
