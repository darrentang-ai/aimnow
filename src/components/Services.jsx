import { Reveal, SectionHead } from './ui'

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
    <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const divisions = [
  {
    tag: 'Division 01',
    title: 'Consultancy',
    desc: 'AI strategy engagements scoped as fixed projects or flexible hourly work — from discovery to a board-ready roadmap.',
    icon: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88Z',
    points: ['AI readiness & opportunity audits', 'Roadmaps with ROI modelling', 'Project or hourly engagement models', 'Vendor & tooling selection'],
    href: '#contact',
    cta: 'Book a strategy call',
  },
  {
    tag: 'Division 02',
    title: 'AI Manager Portal',
    desc: 'A freemium marketplace connecting businesses with trusted AI Managers — match, manage, and ship delivery in one place.',
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    points: ['Trusted, reputation-ranked AI Managers', 'Freemium access to start free', 'Managed delivery & milestones', 'Scoped matching to your roadmap'],
    href: '#portal',
    cta: 'Join the Portal',
    featured: true,
  },
]

const offerings = [
  { icon: 'M1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2ZM8 2v16M16 6v16', title: 'Strategy & Roadmaps', desc: 'Translate ambition into a sequenced, fundable plan.' },
  { icon: 'M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM21 21l-4.35-4.35', title: 'Use-case Discovery', desc: 'Find the AI bets that actually move your numbers.' },
  { icon: 'M16 18l6-6-6-6M8 6l-6 6 6 6', title: 'Implementation', desc: 'Trusted AI Managers build and ship through the Portal.' },
  { icon: 'M3 3v18h18M7 16l4-4 3 3 5-6', title: 'Measurement', desc: 'ROI tracking so value is provable, not promised.' },
]

export default function Services() {
  return (
    <section id="services" className="relative py-20 md:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHead
            eyebrow="What we do"
            title="Two divisions, one company"
            sub="AIM NOW pairs senior strategy with a marketplace of builders — so the plan and the people who deliver it live under one roof."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {divisions.map((d, i) => (
            <Reveal key={d.title} delay={i * 0.08}>
              <div className={`card card-hover h-full ${d.featured ? 'border-cyan-glow/40 shadow-glow-sm' : ''}`}>
                {d.featured && (
                  <span className="absolute right-5 top-5 chip !py-1 !text-[10px]">Most popular</span>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-aim-blue/20 to-cyan-glow/10 text-cyan-glow ring-1 ring-cyan-glow/30">
                  <Icon d={d.icon} />
                </div>
                <div className="mt-5 text-xs font-semibold uppercase tracking-wider text-cyan-glow/80">{d.tag}</div>
                <h3 className="mt-1 font-display text-2xl font-700 text-white">{d.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{d.desc}</p>
                <ul className="mt-5 space-y-2.5">
                  {d.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" fill="none">
                        <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
                <a
                  href={d.href}
                  className={`mt-7 inline-flex items-center gap-2 text-sm font-semibold ${
                    d.featured ? 'text-cyan-glow' : 'text-white'
                  } transition-colors hover:text-cyan-glow`}
                >
                  {d.cta}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {offerings.map((o, i) => (
            <Reveal key={o.title} delay={i * 0.06}>
              <div className="card card-hover h-full">
                <div className="text-cyan-glow">
                  <Icon d={o.icon} />
                </div>
                <h4 className="mt-4 font-display text-base font-600 text-white">{o.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{o.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
