import { Reveal, SectionHead } from './ui'

// Client logos come in different brand colours, so each sits on a light
// "logo plate" for consistent legibility against the dark theme.
const companies = [
  {
    name: 'Astra Worldwide',
    href: 'https://astraworldwide.com/',
    logo: '/logos/astra.webp',
    projects: [
      {
        status: 'done',
        title: 'AI contact data-mining & enrichment',
        desc: 'An AI-powered tool that data-mines for new contacts and enriches their details via the Lusha API.',
        review: {
          rating: 5,
          quote:
            'Exceptionally happy with the service! The results exceeded my expectations—professional, efficient, and exactly what I needed. This will definitely help Astra attract new business and grow our client base. Highly recommend!',
          author: 'Martin Kinsey',
          role: 'Co-founder, Astra Worldwide',
        },
      },
      {
        status: 'done',
        title: 'BDM activity Workbench',
        desc: 'A web app — “Workbench” — to track business-development manager activity end to end.',
        review: {
          rating: 5,
          quote:
            'The BDM Activity Workbench build was outstanding! The intuitive design, seamless workflow, and powerful search tools make it easy to track leads, manage pipelines, and identify new business opportunities. This will significantly boost our outreach and conversion rates. Perfect for any sales or business development team!',
          author: 'Martin Kinsey',
          role: 'Co-founder, Astra Worldwide',
        },
      },
    ],
  },
  {
    name: 'Gaucin Properties',
    href: 'https://gaucinproperties.com/en/',
    logo: '/logos/gaucin.png',
    projects: [
      {
        status: 'progress',
        title: 'Full website rebuild',
        desc: 'A complete rebuild of the website with a modern look and feel.',
      },
    ],
  },
]

function Stars({ n }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${n} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${i < n ? 'text-cyan-glow' : 'text-white/15'}`} fill="currentColor">
          <path d="m12 2 2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88-5-4.87 7.1-1.01L12 2Z" />
        </svg>
      ))}
    </div>
  )
}

function StatusTag({ status }) {
  const done = status === 'done'
  return done ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-glow/30 bg-cyan-glow/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-glow">
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
        <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Completed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
      <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-amber-300" />
      In progress
    </span>
  )
}

export default function Projects() {
  return (
    <section id="projects" className="relative py-20 md:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHead
            eyebrow="Our work"
            title="Recent projects"
            sub="A snapshot of work we've delivered — from AI tooling to full product builds."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {companies.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.08}>
              <div className="card card-hover flex h-full flex-col">
                <div className="flex items-center justify-between gap-4">
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-14 items-center rounded-xl bg-white px-4 transition-transform hover:scale-[1.02]"
                    aria-label={`Visit ${c.name}`}
                  >
                    <img src={c.logo} alt={c.name} className="h-8 w-auto" loading="lazy" />
                  </a>
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-slate-300 transition-colors hover:text-cyan-glow"
                  >
                    Visit site
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>

                <h3 className="mt-5 font-display text-xl font-700 text-white">{c.name}</h3>

                <ul className="mt-5 space-y-4">
                  {c.projects.map((p) => (
                    <li key={p.title} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="font-display text-base font-600 text-white">{p.title}</h4>
                        <StatusTag status={p.status} />
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{p.desc}</p>
                      {p.review && (
                        <figure className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <Stars n={p.review.rating} />
                          <blockquote className="mt-2 text-sm italic leading-relaxed text-slate-300">
                            “{p.review.quote}”
                          </blockquote>
                          <figcaption className="mt-2.5 text-xs font-semibold text-white">
                            {p.review.author}
                            <span className="font-normal text-slate-400"> · {p.review.role}</span>
                          </figcaption>
                        </figure>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
