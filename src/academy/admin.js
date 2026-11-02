import { supabase } from '../lib/supabase'
import { COURSE_ID } from './ids'

// One row per learner who has done anything at all. The function is
// security definer and admin-gated in supabase/academy.sql, so a non-admin
// simply gets an empty list rather than an error — see the note there.
//
// Imports ../ids rather than ./content on purpose: this is reached from the
// portal bundle, which has no business carrying the course text.
export async function loadAcademyOverview() {
  const { data, error } = await supabase.rpc('academy_admin_overview', { p_course_id: COURSE_ID })
  return { learners: data ?? [], error }
}
