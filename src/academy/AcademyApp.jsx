import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { isConfigured, supabase } from '../lib/supabase'
import SignIn from '../portal/SignIn'
import { Alert } from '../portal/ui'
import Certificate from './Certificate'
import CourseHome from './CourseHome'
import Lesson from './Lesson'
import Quiz from './Quiz'
import {
  completeLesson,
  courseState,
  loadProgress,
  recordAttempt,
  recordExercise,
  uncompleteLesson,
} from './progress'
import { AcademyShell, Contents } from './ui'

function NotConfigured() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="card">
        <h1 className="font-display text-xl font-700 text-white">Academy not configured</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          This build has no Supabase credentials, so sign-in and progress tracking are unavailable. Set{' '}
          <code className="text-cyan-glow">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-cyan-glow">VITE_SUPABASE_ANON_KEY</code>, then run{' '}
          <code className="text-slate-300">supabase/academy.sql</code> in the Supabase SQL editor.
        </p>
      </div>
    </div>
  )
}

export default function AcademyApp() {
  // Mirrors PortalApp: undefined = still checking, null = signed out. The
  // academy is members-only, so the whole course sits behind this.
  const [session, setSession] = useState(isConfigured ? undefined : null)
  const [profile, setProfile] = useState(null)
  const [state, setState] = useState(null)
  const [error, setError] = useState('')
  const location = useLocation()

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
      setState(null)
      return
    }
    let cancelled = false
    ;(async () => {
      // The name is only needed for the certificate, but it comes from the same
      // place as everything else about an account and costs one small query.
      const [{ data: p }, progress] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
        loadProgress(userId),
      ])
      if (cancelled) return
      if (progress.error) {
        // The most likely cause by far is academy.sql not having been run, and
        // a bare PostgREST message would send someone hunting in the wrong
        // place entirely.
        setError(
          `${progress.error.message} — if this mentions a missing table, run supabase/academy.sql in the Supabase SQL editor.`
        )
        return
      }
      setProfile(p ?? null)
      setState({ completed: progress.completed, attempts: progress.attempts, exercises: progress.exercises })
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  // Progress is written through, then mirrored locally rather than refetched:
  // the server is the record, but a round trip between pressing "complete" and
  // the tick appearing would be felt on every single lesson.
  const onComplete = useCallback(
    async (lessonId) => {
      setState((prev) => ({ ...prev, completed: new Set(prev.completed).add(lessonId) }))
      const { error } = await completeLesson(userId, lessonId)
      if (error) {
        setError(error.message)
        setState((prev) => {
          const completed = new Set(prev.completed)
          completed.delete(lessonId)
          return { ...prev, completed }
        })
      }
    },
    [userId]
  )

  const onUncomplete = useCallback(
    async (lessonId) => {
      setState((prev) => {
        const completed = new Set(prev.completed)
        completed.delete(lessonId)
        return { ...prev, completed }
      })
      const { error } = await uncompleteLesson(userId, lessonId)
      if (error) {
        setError(error.message)
        setState((prev) => ({ ...prev, completed: new Set(prev.completed).add(lessonId) }))
      }
    },
    [userId]
  )

  // Marked on screen the moment it is submitted, so a slow save never holds up
  // the feedback — the point of the drill. The write is still reported if it
  // fails, because a learner who comes back to a reset exercise deserves to
  // know why.
  const onExercise = useCallback(
    async (exerciseId, { score, total, response }) => {
      setState((prev) => ({
        ...prev,
        exercises: { ...prev.exercises, [exerciseId]: { exercise_id: exerciseId, score, total, response } },
      }))
      const { error } = await recordExercise(userId, { exerciseId, score, total, response })
      if (error) setError(error.message)
    },
    [userId]
  )

  // No optimistic update here: the pass flag is computed by the database
  // trigger, so the inserted row is the only trustworthy version of the result.
  const onSubmitQuiz = useCallback(
    async (attemptInput) => {
      const { attempt, error } = await recordAttempt(userId, attemptInput)
      if (!error && attempt) {
        setState((prev) => ({ ...prev, attempts: [attempt, ...prev.attempts] }))
      }
      return { attempt, error }
    },
    [userId]
  )

  if (!isConfigured) {
    return (
      <AcademyShell>
        <NotConfigured />
      </AcademyShell>
    )
  }

  if (session === undefined) {
    return (
      <AcademyShell>
        <p className="text-sm text-slate-400">Loading…</p>
      </AcademyShell>
    )
  }

  if (!session) {
    return (
      <AcademyShell>
        <div className="mx-auto max-w-lg">
          <p className="mb-6 text-center text-sm leading-relaxed text-slate-400">
            The Academy is open to AIM Now members. Sign in to start the course — your progress and assessment results
            are saved to your account.
          </p>
          <SignIn />
        </div>
      </AcademyShell>
    )
  }

  const shellProps = {
    email: session.user.email,
    onSignOut: () => supabase.auth.signOut(),
  }

  if (error) {
    return (
      <AcademyShell {...shellProps}>
        <Alert>{error}</Alert>
      </AcademyShell>
    )
  }

  if (!state) {
    return (
      <AcademyShell {...shellProps}>
        <p className="text-sm text-slate-400">Loading your progress…</p>
      </AcademyShell>
    )
  }

  // The contents list is for working through the course; on the overview and
  // the certificate it would just repeat what the page already shows.
  const bare = location.pathname === '/academy' || location.pathname === '/academy/certificate'
  const navState = { ...state, finalPassed: courseState(state).finalPassed }

  return (
    <AcademyShell {...shellProps} sidebar={bare ? null : <Contents state={navState} />}>
      <Routes>
        <Route path="/" element={<CourseHome state={state} />} />
        <Route path="final" element={<Quiz kind="final" state={state} onSubmit={onSubmitQuiz} />} />
        <Route
          path="certificate"
          element={<Certificate state={state} name={profile?.full_name} email={session.user.email} />}
        />
        <Route path=":moduleSlug/quiz" element={<Quiz kind="module" state={state} onSubmit={onSubmitQuiz} />} />
        <Route
          path=":moduleSlug/:lessonSlug"
          element={
            <Lesson state={state} onComplete={onComplete} onUncomplete={onUncomplete} onExercise={onExercise} />
          }
        />
        <Route path="*" element={<Navigate to="/academy" replace />} />
      </Routes>
    </AcademyShell>
  )
}
