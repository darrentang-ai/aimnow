// Issuer domains whose verification pages we accept. A certificate is only
// worth showing a business if they can click through and check it, so a name
// alone isn't enough.
//
// This mirrors certificate_host_allowed() in supabase/schema.sql. That check
// constraint is what actually enforces the rule — this copy exists so the
// manager gets told before they submit, rather than getting a database error.
// Keep the two lists in step.
export const VERIFIER_HOSTS = [
  'academy.claude.com', // Anthropic
  'verify.skilljar.com', // Google Cloud Skills Boost, and others on Skilljar
  'credly.com', // AWS, Microsoft, IBM
  'credential.net', // Accredible
  'coursera.org',
  'learn.microsoft.com',
  'cloudskillsboost.google',
]

// Returns the matched issuer host, or null if the link isn't one we accept.
export function verifierFor(url) {
  let parsed
  try {
    parsed = new URL(String(url).trim())
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:') return null

  const host = parsed.hostname.toLowerCase()
  // Exact host, or a subdomain of it. Comparing by substring would accept
  // credly.com.example.com, which belongs to whoever registered example.com.
  return VERIFIER_HOSTS.find((h) => host === h || host.endsWith(`.${h}`)) ?? null
}

// The right host isn't enough — https://academy.claude.com/test would pass one.
// This doesn't prove a credential exists; only an admin opening the link does
// that. It keeps obvious rubbish out of the review queue.
//
// Mirrors certificate_url_wellformed() in supabase/schema.sql.
const SHAPES = {
  'academy.claude.com': /^\/verify\/[0-9a-f]{16,}\/?$/i,
  'verify.skilljar.com': /^\/c\/[0-9a-z]{8,}\/?$/i,
}

export function urlLooksLikeCredential(url) {
  let parsed
  try {
    parsed = new URL(String(url).trim())
  } catch {
    return false
  }
  const shape = SHAPES[parsed.hostname.toLowerCase()]
  // Issuers we know exactly are checked exactly; the rest just have to carry
  // an identifier-shaped path rather than a bare or placeholder one.
  return shape ? shape.test(parsed.pathname) : parsed.pathname.length >= 10
}

export function describeAccepted() {
  return VERIFIER_HOSTS.join(', ')
}
