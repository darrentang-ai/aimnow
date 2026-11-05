import { supabase } from '../lib/supabase'
import { COURSE_ID, FINAL_ID, allLessonIds, modules } from './content'

// Everything the academy screens need about one learner, in two queries. Both
// tables are small per user and the whole course is on screen at once — a
// sidebar showing every module's state would otherwise mean a query per module.
export async function loadProgress(userId) {
  const [lessons, attempts, exercises, payment] = await Promise.all([
    supabase
      .from('academy_lesson_progress')
      .select('lesson_id, created_at')
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID),
    supabase
      .from('academy_quiz_attempts')
      .select('id, assessment_id, score, total, pass_mark, passed, answers, created_at')
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID)
      .order('created_at', { ascending: false }),
    supabase
      .from('academy_exercise_responses')
      .select('exercise_id, score, total, response')
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID),
    supabase
      .from('academy_certificate_payments')
      .select('paid_at')
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID)
      .maybeSingle(),
  ])

  if (lessons.error) return { error: lessons.error }
  if (attempts.error) return { error: attempts.error }
  if (exercises.error) return { error: exercises.error }
  if (payment.error) return { error: payment.error }

  return {
    // The certificate is charged for; passing the final is not enough on its
    // own. See academy_certificate_payments in supabase/academy.sql.
    certificatePaid: Boolean(payment.data),
    // A Set because every lesson row in the sidebar asks the same question.
    completed: new Set((lessons.data ?? []).map((r) => r.lesson_id)),
    attempts: attempts.data ?? [],
    // Keyed by exercise id: a lesson asks about its own exercises by name, and
    // never iterates them.
    exercises: Object.fromEntries((exercises.data ?? []).map((r) => [r.exercise_id, r])),
  }
}

// upsert rather than insert: finishing a lesson twice is a normal thing for a
// learner to do (re-reading, or a double click), and it should be a no-op
// rather than a primary-key error surfaced as a red banner.
export async function completeLesson(userId, lessonId) {
  const { error } = await supabase
    .from('academy_lesson_progress')
    .upsert({ user_id: userId, course_id: COURSE_ID, lesson_id: lessonId }, { onConflict: 'user_id,course_id,lesson_id' })
  return { error }
}

export async function uncompleteLesson(userId, lessonId) {
  const { error } = await supabase
    .from('academy_lesson_progress')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', COURSE_ID)
    .eq('lesson_id', lessonId)
  return { error }
}

// Upsert, not insert: redoing a drill replaces the row. See the note on
// academy_exercise_responses in supabase/academy.sql for why these are kept
// differently from quiz attempts.
export async function recordExercise(userId, { exerciseId, score, total, response }) {
  const { data, error } = await supabase
    .from('academy_exercise_responses')
    .upsert(
      {
        user_id: userId,
        course_id: COURSE_ID,
        exercise_id: exerciseId,
        score,
        total,
        response,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id,exercise_id' }
    )
    .select('exercise_id, score, total, response')
    .single()
  return { exercise: data, error }
}

// `passed` is deliberately not sent: academy_set_passed() computes it in the
// database from score, total and pass_mark. Sending it would invite a client
// that disagreed.
export async function recordAttempt(userId, { assessmentId, score, total, passMark, answers }) {
  const { data, error } = await supabase
    .from('academy_quiz_attempts')
    .insert({
      user_id: userId,
      course_id: COURSE_ID,
      assessment_id: assessmentId,
      score,
      total,
      pass_mark: passMark,
      answers,
    })
    .select('id, assessment_id, score, total, pass_mark, passed, answers, created_at')
    .single()
  return { attempt: data, error }
}

// -----------------------------------------------------------------------------
// Derivations. Whether something is passed is always computed from the attempt
// rows rather than stored, so a screen can never show a pass the history does
// not support.
// -----------------------------------------------------------------------------

export function bestAttempt(attempts, assessmentId) {
  return (attempts ?? [])
    .filter((a) => a.assessment_id === assessmentId)
    .reduce((best, a) => {
      if (!best) return a
      // Ratio rather than raw score: an assessment may gain or lose questions
      // between attempts, and 8/10 should still beat 7/8.
      return a.score / a.total > best.score / best.total ? a : best
    }, null)
}

export function latestAttempt(attempts, assessmentId) {
  // loadProgress returns newest first, so the first match is the latest.
  return (attempts ?? []).find((a) => a.assessment_id === assessmentId) ?? null
}

export function hasPassed(attempts, assessmentId) {
  return (attempts ?? []).some((a) => a.assessment_id === assessmentId && a.passed)
}

export function moduleState(mod, { completed, attempts }) {
  const ids = mod.lessons.map((l) => `${mod.slug}/${l.slug}`)
  const done = ids.filter((id) => completed.has(id)).length
  const passed = hasPassed(attempts, mod.slug)
  return {
    lessonsDone: done,
    lessonsTotal: ids.length,
    lessonsComplete: done === ids.length,
    quizPassed: passed,
    // The quiz is the module's gate, so a module is only finished once both
    // halves are.
    complete: done === ids.length && passed,
    best: bestAttempt(attempts, mod.slug),
  }
}

export function courseState({ completed, attempts }) {
  const lessonsDone = allLessonIds.filter((id) => completed.has(id)).length
  const modulesComplete = modules.filter((m) => moduleState(m, { completed, attempts }).complete).length
  const finalPassed = hasPassed(attempts, FINAL_ID)
  return {
    lessonsDone,
    lessonsTotal: allLessonIds.length,
    modulesComplete,
    modulesTotal: modules.length,
    finalPassed,
    // The certificate is the whole course: every lesson read, every module
    // quiz passed, and the final passed. Anything looser would make it a
    // participation badge.
    certified: lessonsDone === allLessonIds.length && modulesComplete === modules.length && finalPassed,
    percent: Math.round((lessonsDone / allLessonIds.length) * 100),
  }
}

// The final is only offered once the course has been worked through — it is the
// assessment, not a shortcut past the material.
export function finalUnlocked(state) {
  return modules.every((m) => moduleState(m, state).complete)
}

export function gradeAnswers(questions, answers) {
  const score = questions.filter((q) => answers[q.id] === q.answer).length
  return { score, total: questions.length }
}
