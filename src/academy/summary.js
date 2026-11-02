import { supabase } from '../lib/supabase'
import { COURSE_ID, FINAL_ID } from './ids'

// One learner's progress in two numbers, for the card on the portal
// dashboards. Deliberately not loadProgress() from ./progress: that returns
// every lesson row and every attempt so the academy screens can derive module
// state from them, and it imports the course content to do it. A card that
// says "12 of 24" needs neither.
//
// head: true with an exact count asks PostgREST for the count alone, so no
// rows cross the wire.
export async function loadMySummary(userId) {
  const [lessons, final] = await Promise.all([
    supabase
      .from('academy_lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID),
    supabase
      .from('academy_quiz_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID)
      .eq('assessment_id', FINAL_ID)
      .eq('passed', true)
      .limit(1),
  ])

  const error = lessons.error ?? final.error
  if (error) return { error }

  return { lessonsDone: lessons.count ?? 0, certified: (final.data ?? []).length > 0 }
}
