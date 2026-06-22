import { Reveal, SectionHead } from './ui'

const steps = [
  { n: '01', title: 'Create a free account', desc: 'Freemium access — describe your business and the outcome you need.' },
  { n: '02', title: 'Get matched', desc: 'We surface vetted, reputation-ranked AI engineers scoped to your roadmap.' },
  { n: '03', title: 'Manage delivery', desc: 'Track milestones, comms, and outcomes from a single managed portal.' },
]

const tiers = [
  {
    name: 'Free',
    price: '£0',
    note: 'Start exploring',
    features: ['Browse vetted engineers', 'Post one open brief', 'Community support', 'Basic matching'],
    cta: 'Create free account',
    featured: false,
  },
  {
    name: 'Pro',
    price: '£149',
    note: 'per month',
    features: ['Unlimited briefs', 'Priority matching', 'Managed delivery dashboard', 'Milestone & escrow tools', 'Dedicated success manager'],
    cta: 'Start Pro',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    note: 'Talk to us',
    features: ['SSO & security review', 'Multi-team workspaces', 'SLA-backed delivery', 'Strategy retainer add-on', 'Procurement support'],
    cta: 'Contact sales',
    featured: false,
  },
]

export default function Portal() {
  return (
    <section id="portal" className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-800/60 via-ink-900 to-ink-900" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-aim-blue/10 blur-[120px]" />

      <div className="container-x">
        <Reveal>
          <SectionHead
            eyebrow="The AI Manager Portal"
            title="Your marketplace of vetted AI engineers"
            sub="A freemium platform that connects businesses with the right builders — and gives you the tools to manage delivery end to end."
          />
        </Reveal>

        {/* How it works */}
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="card h-full">
                <div className="font-display text-4xl font-700 text-white/10">{s.n}</div>
                <h3 className="mt-2 font-display text-lg font-600 text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Pricing */}
        <Reveal>
          <h3 className="mt-20 text-center font-display text-2xl font-700 text-white">
            Simple, freemium pricing
          </h3>
        </Reveal>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div
                className={`card relative h-full ${
                  t.featured
                    ? 'border-cyan-glow/50 bg-gradient-to-b from-aim-blue/10 to-transparent shadow-glow ring-1 ring-cyan-glow/20 lg:-translate-y-2'
                    : 'card-hover'
                }`}
              >
                {t.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip !bg-cyan-glow !text-ink-900">
                    Recommended
                  </span>
                )}
                <div className="text-sm font-semibold uppercase tracking-wider text-cyan-glow">{t.name}</div>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="font-display text-4xl font-700 text-white">{t.price}</span>
                  <span className="mb-1.5 text-sm text-slate-400">{t.note}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" fill="none">
                        <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`mt-8 block w-full text-center ${t.featured ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {t.cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
