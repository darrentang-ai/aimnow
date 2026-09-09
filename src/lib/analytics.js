// GA4 events. The gtag script is absent whenever an ad blocker drops it, so
// every call here has to degrade to a no-op rather than throw.
function send(event, params) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', event, params)
}

// Both the Projects CTA and the discovery band ask for the same interest, so
// `interest` alone can't tell you which one earned a booking. The Projects CTA
// records itself here and the form reads it back on a successful submit.
let lastCta = null

// Fired once per page load, when the Projects section is actually reached —
// GA4's built-in `scroll` event only reports 90% page depth, which on a
// single-page site means "saw the footer", not "saw the work".
export function trackProjectsView() {
  send('view_projects')
}

export function trackProjectsCtaClick() {
  lastCta = 'projects_section'
  send('projects_cta_click')
}

// Portal plan CTAs. One event name per plan, so each gets its own row in GA4's
// Events report without needing a custom dimension registered.
//
// Intent, not completion — every plan CTA routes to the contact form, so the
// enquiry itself is still recorded by `generate_lead` below. Deliberately not
// `sign_up` or `purchase`, which would imply the plan was actually taken up.
export function trackPlanClick(plan) {
  lastCta = `portal_${plan}`
  send(`portal_${plan}_plan_click`)
}

// `generate_lead` is a GA4 recommended event name, so it drops into conversion
// reporting without custom setup. Mark it as a key event in Admin → Events.
export function trackLead(interest) {
  send('generate_lead', { interest, cta_source: lastCta ?? 'other' })
}
