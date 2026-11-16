// Spots addresses that are probably wrong, from the list the admin People tab
// already has. Nothing here is certain: a flag means "look at this", not "this
// is broken", and the wording says so.
//
// "Never confirmed" needs admin_list_people to return email_confirmed, which
// country.sql adds. Until that has been run the field is simply absent and the
// check stays quiet, rather than flagging everyone.

const SHAPE = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i

// The big providers, where a one-letter slip is far more likely than a real
// domain that happens to sit next to them.
const COMMON = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com']

// Real domains that are close to a common one, so they must never be flagged.
const REAL = new Set([
  ...COMMON,
  'googlemail.com',
  'mail.com',
  'live.com',
  'me.com',
  'msn.com',
  'aol.com',
  'gmx.com',
  'proton.me',
  'protonmail.com',
  'yahoo.co.uk',
  'hotmail.co.uk',
  'outlook.co.uk',
])

function distance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = up
    }
  }
  return prev[b.length]
}

// Two neighbouring letters the wrong way round (gmial). Plain edit distance
// counts that as two changes, so it needs its own check.
function swapped(a, b) {
  if (a.length !== b.length) return false
  const at = [...a].findIndex((ch, i) => ch !== b[i])
  return at >= 0 && a[at] === b[at + 1] && a[at + 1] === b[at] && a.slice(at + 2) === b.slice(at + 2)
}

// What the domain was probably meant to be, or null. A domain that is itself a
// known real one is never a typo, whatever it sits next to.
function likelyDomain(domain) {
  if (REAL.has(domain)) return null
  return COMMON.find((c) => distance(domain, c) <= 1 || swapped(domain, c)) ?? null
}

// Gmail ignores dots and anything after a +, so a.b@gmail.com and ab+x@gmail.com
// are one inbox. Everywhere else the address is only compared ignoring case.
function mailbox(email) {
  const [local, domain = ''] = email.trim().toLowerCase().split('@')
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${local.split('+')[0].replace(/\./g, '')}@gmail.com`
  }
  return `${local}@${domain}`
}

// Map of person id -> list of reasons. People with nothing wrong are absent.
export function emailIssues(people) {
  const issues = new Map()
  const add = (id, text) => issues.set(id, [...(issues.get(id) ?? []), text])

  const byMailbox = new Map()
  for (const p of people) {
    if (!p.email) continue
    if (p.email_confirmed === false) {
      add(p.id, 'Never confirmed, so the address may not be theirs or may be mistyped')
    }
    if (!SHAPE.test(p.email)) {
      add(p.id, 'Not a valid email address')
      continue
    }
    const domain = p.email.split('@')[1].toLowerCase()
    const meant = likelyDomain(domain)
    if (meant) add(p.id, `Domain looks like a typo of ${meant}`)

    const key = mailbox(p.email)
    byMailbox.set(key, [...(byMailbox.get(key) ?? []), p])
  }

  for (const group of byMailbox.values()) {
    if (group.length < 2) continue
    for (const p of group) {
      const others = group.filter((o) => o.id !== p.id).map((o) => o.email)
      add(p.id, `Same inbox as ${others.join(', ')}`)
    }
  }
  return issues
}
