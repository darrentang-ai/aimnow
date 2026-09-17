import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Landing from './Landing'

// Lazy so the marketing page doesn't ship the Supabase client. Loading it
// eagerly roughly doubled the landing bundle, and that page is the conversion
// surface — it should not pay for code only /portal uses.
const PortalApp = lazy(() => import('./portal/PortalApp'))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      {/* Splat so PortalApp can own its own nested routes. */}
      <Route
        path="/portal/*"
        element={
          <Suspense fallback={<div className="min-h-screen bg-ink-900" />}>
            <PortalApp />
          </Suspense>
        }
      />
      {/* Anything else falls back to the marketing page rather than a blank
          screen — there are no other real paths yet. */}
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
