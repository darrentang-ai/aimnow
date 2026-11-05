import { supabase } from '../lib/supabase'
import { COURSE_ID } from './ids'

// One row per learner who has done anything at all. The function is
// security definer and admin-gated in supabase/academy.sql, so a non-admin
// simply gets an empty list rather than an error — see the note there.
//
// Imports ../ids rather than ./content on purpose: this is reached from the
// portal bundle, which has no business carrying the course text.
// Who has paid for their certificate. Separate from the overview because that
// function's columns are fixed by a security definer function, and a plain
// select under the admin's read policy is all this needs.
export async function loadCertificatePayments() {
  const { data, error } = await supabase.from('academy_certificate_payments').select('user_id').eq('course_id', COURSE_ID)
  return { paid: new Set((data ?? []).map((r) => r.user_id)), error }
}

export async function setCertificatePaid(userId, paid) {
  const { error } = await supabase.rpc('academy_set_certificate_paid', {
    p_user_id: userId,
    p_course_id: COURSE_ID,
    p_paid: paid,
  })
  return { error }
}

export async function loadAcademyOverview() {
  const { data, error } = await supabase.rpc('academy_admin_overview', { p_course_id: COURSE_ID })
  return { learners: data ?? [], error }
}
