import { supabase } from '../lib/supabase'
import { COURSE_ID, FINAL_ID, MODULE_SHAPE } from './ids'

// One learner's progress in two numbers, for the card on the portal
// dashboards. Deliberately not loadProgress() from ./progress: that returns
// every lesson row and every attempt so the academy screens can derive module
// state from them, and it imports the course content to do it. A card that
// says "12 of 24" needs neither.
//
// head: true with an exact count asks PostgREST for the count alone, so no
// rows cross the wire.
export async function loadMySummary(userId) {
  const [lessons, final, payment] = await Promise.all([
    // The ids rather than a bare count: which module someone is up to comes
    // from them. At most one row per lesson, so still a handful of rows.
    supabase
      .from('academy_lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID),
    supabase
      .from('academy_quiz_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID)
      .eq('assessment_id', FINAL_ID)
      .eq('passed', true)
      // The first pass, so a retake can't change the id. It is the certificate's
      // verification link, and an admin's approval is tied to that link.
      .order('created_at', { ascending: true })
      .limit(1),
    supabase
      .from('academy_certificate_payments')
      .select('paid_at')
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID)
      .maybeSingle(),
  ])

  const error = lessons.error ?? final.error ?? payment.error
  if (error) return { error }

  const finalAttemptId = final.data?.[0]?.id ?? null
  const done = new Set((lessons.data ?? []).map((r) => r.lesson_id))
  // The first module with a lesson still open, 1-based; null once every lesson
  // is read and only the final is left.
  const idx = MODULE_SHAPE.findIndex((m) => {
    const read = [...done].filter((id) => id.startsWith(`${m.slug}/`)).length
    return read < m.lessons
  })
  return {
    lessonsDone: done.size,
    resumeModule: idx === -1 ? null : idx + 1,
    certified: finalAttemptId !== null,
    finalAttemptId,
    paid: Boolean(payment.data),
  }
}
