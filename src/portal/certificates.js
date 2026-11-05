// Whether a certificate counts is decided by an admin opening the link and
// approving it, not by anything checkable here. So this only rules out links
// that couldn't be reviewed at all.
//
// https rather than any URL: these are rendered as hrefs, and javascript: is
// a URL too. Mirrors certificates_valid() in supabase/schema.sql, which is
// what actually enforces it — the column is writable through the API, so a
// check in the client alone would be decoration.
export function isVerificationLink(url) {
  let parsed
  try {
    parsed = new URL(String(url).trim())
  } catch {
    return false
  }
  return parsed.protocol === 'https:'
}

// An Academy certificate goes through the same admin approval as any other,
// rather than being approved automatically on a pass. Attempts are written by
// the browser (see academy_set_passed() in supabase/academy.sql), so a pass on
// its own is not proof enough to hand out half of the gate to the network.
export const ACADEMY_CERTIFICATE_NAME = 'AIM Now Academy: Generative AI Fundamentals'
export const academyCertificatePath = (attemptId) => `/verify/${attemptId}`
