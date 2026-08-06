import { Reveal } from './ui'

// Must match an entry in Contact.jsx's `interests` array, or the preselect
// silently does nothing. Exported so other CTAs reuse the exact string.
export const DISCOVERY_INTEREST = 'Free 30-min AI discovery call'

export default function DiscoveryCTA() {
  // No vertical padding of its own — the FAQ above and Contact below both carry
  // py-20/py-28, which leaves this band evenly spaced between them.
  return (
    <section id="discovery" className="relative">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-cyan-glow/40 bg-gradient-to-br from-aim-blue/15 via-ink-800 to-ink-900 p-8 text-center shadow-glow-sm md:p-12">
            <span className="chip">Free · No obligation</span>
            <h2 className="mt-5 font-display text-3xl font-700 leading-tight text-white sm:text-4xl">
              Free 30-minute AI discovery call
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">
              A straight-talking conversation about where AI actually fits your business — no pitch,
              no jargon. You'll come away knowing which opportunities are worth pursuing, and which
              aren't.
            </p>
            <a
              href="#contact"
              onClick={() => window.dispatchEvent(new CustomEvent('aimnow:interest', { detail: DISCOVERY_INTEREST }))}
              className="btn-primary mt-8"
            >
              Book your free call
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
