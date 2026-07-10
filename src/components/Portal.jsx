import { Reveal, SectionHead } from './ui'

const steps = [
  { n: '01', title: 'Create a free account', desc: 'Freemium access — describe your business and the outcome you need.' },
  { n: '02', title: 'Get matched', desc: 'We surface trusted, reputation-ranked AI Managers scoped to your roadmap.' },
  { n: '03', title: 'Manage delivery', desc: 'Track milestones, comms, and outcomes from a single managed portal.' },
]

const tiers = [
  {
    name: 'Free',
    price: '£0',
    note: 'Start exploring',
    features: ['Post one project', 'Notified when bids arrive', 'Browse AI Manager profiles', 'Community support'],
    cta: 'Create free account',
    interest: 'AI Manager Portal — Free plan',
    featured: false,
  },
  {
    name: 'Premium',
    price: '£49',
    note: 'per month',
    features: ['View all bids & amounts', 'Full profiles & ratings', 'Shortlist & compare bids', 'Message AI Managers directly', 'Priority project placement', 'Save 20% billed annually (£39/mo)'],
    cta: 'Start Premium plan',
    interest: 'AI Manager Portal — Premium plan',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    note: 'Talk to us',
    features: ['Multi-user accounts', 'API access', 'White-label reporting', 'SLA guarantee', 'Dedicated support', 'Retainer agreement'],
    cta: 'Contact sales',
    interest: 'AI Manager Portal — Enterprise plan',
    featured: false,
  },
]

export default function Portal() {
  return (
    <section id="portal" className="relative overflow-hidden py-20 md:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHead
            eyebrow="The AI Manager Portal"
            title="Your marketplace of trusted AI Managers"
            sub="A freemium platform that connects businesses with the right builders — and gives you the tools to manage delivery end to end."
          />
        </Reveal>

        {/* How it works */}
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="card h-full">
                <div className="font-display text-4xl font-700 text-cyan-glow/20">{s.n}</div>
                <h3 className="mt-2 font-display text-lg font-600 text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Pricing */}
        <Reveal>
          <h3 className="mt-20 text-center font-display text-2xl font-700 text-white">
            Simple, freemium plan
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
                  onClick={() => window.dispatchEvent(new CustomEvent('aimnow:interest', { detail: t.interest }))}
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
