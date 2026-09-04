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

// `generate_lead` is a GA4 recommended event name, so it drops into conversion
// reporting without custom setup. Mark it as a key event in Admin → Events.
export function trackLead(interest) {
  send('generate_lead', { interest, cta_source: lastCta ?? 'other' })
}
