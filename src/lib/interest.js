// Preselecting the contact form works two ways, because there are two kinds of
// link into it.
//
// From the landing page itself, a CTA dispatches the `aimnow:interest` event —
// Contact is already mounted and listening. From /portal it isn't: the Portal
// is a different route, so the event would fire into nothing and the form
// would mount afterwards on its default option. Those links carry ?interest=
// instead, which survives the navigation.
//
// Short slugs rather than the labels themselves, so a URL someone copies out
// of the address bar doesn't break when the wording of an option changes.
export const INTEREST_SLUGS = {
  call: 'Free 30-min AI discovery call',
  premium: 'AI Manager Portal — Premium plan',
  enterprise: 'AI Manager Portal — Enterprise plan',
  consultancy: 'Consultancy engagement',
}

export function interestFromSearch(search) {
  return INTEREST_SLUGS[new URLSearchParams(search).get('interest')] ?? null
}
