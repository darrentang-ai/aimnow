import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { isConfigured, supabase } from '../lib/supabase'
import AdminDashboard from './AdminDashboard'
import BusinessDashboard from './BusinessDashboard'
import ManagerDashboard from './ManagerDashboard'
import PostProject from './PostProject'
import SignIn from './SignIn'
import { Alert, PortalShell } from './ui'

function NotConfigured() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="card">
        <h1 className="font-display text-xl font-700 text-white">Portal not configured</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          This build has no Supabase credentials, so sign-in is unavailable. Set{' '}
          <code className="text-cyan-glow">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-cyan-glow">VITE_SUPABASE_ANON_KEY</code> — locally in{' '}
          <code className="text-slate-300">.env</code>, and in Netlify under Site configuration →
          Environment variables — then redeploy.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          See <code className="text-slate-300">supabase/schema.sql</code> for the database setup.
        </p>
      </div>
    </div>
  )
}

export default function PortalApp() {
  // undefined = still checking, null = signed out.
  const [session, setSession] = useState(isConfigured ? undefined : null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('id, role, full_name, company')
      .eq('id', userId)
      // maybeSingle, not single: a missing row means the handle_new_user
      // trigger never ran, which is worth reporting clearly rather than as a
      // generic query error.
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else if (!data) setError('No profile row for this account — run supabase/schema.sql, then sign in again.')
        else setProfile(data)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (!isConfigured) {
    return (
      <PortalShell>
        <NotConfigured />
      </PortalShell>
    )
  }

  if (session === undefined) {
    return (
      <PortalShell>
        <p className="text-sm text-slate-400">Loading…</p>
      </PortalShell>
    )
  }

  if (!session) {
    return (
      <PortalShell>
        <SignIn />
      </PortalShell>
    )
  }

  const shellProps = {
    email: session.user.email,
    role: profile?.role,
    onSignOut: () => supabase.auth.signOut(),
  }

  if (error) {
    return (
      <PortalShell {...shellProps}>
        <Alert>{error}</Alert>
      </PortalShell>
    )
  }

  if (!profile) {
    return (
      <PortalShell {...shellProps}>
        <p className="text-sm text-slate-400">Loading your account…</p>
      </PortalShell>
    )
  }

  const dashboard =
    profile.role === 'admin' ? (
      <AdminDashboard userId={userId} />
    ) : profile.role === 'manager' ? (
      <ManagerDashboard userId={userId} />
    ) : (
      <BusinessDashboard userId={userId} />
    )

  return (
    <PortalShell {...shellProps}>
      <Routes>
        <Route path="/" element={dashboard} />
        <Route path="new" element={<PostProject userId={userId} />} />
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Routes>
    </PortalShell>
  )
}
