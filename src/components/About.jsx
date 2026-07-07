import { Reveal, Eyebrow } from './ui'

const values = [
  { title: 'Reputation first', desc: 'We build from reputation — every AI Manager is trusted and ranked on real delivery.' },
  { title: 'Roadmap, not hype', desc: 'Strategy grounded in ROI, not the latest buzzword cycle.' },
  { title: 'Global by default', desc: 'Teams and clients across UK, Europe, North America, ANZ and APAC.' },
]

export default function About() {
  return (
    <section id="about" className="relative py-20 md:py-28">
      <div className="container-x">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <Eyebrow className="mb-5">Who we are</Eyebrow>
            <h2 className="font-display text-3xl font-700 leading-tight text-white sm:text-4xl">
              An AI strategy consultancy built to <span className="text-gradient">deliver</span>, not just advise.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400">
              AIM NOW serves SMEs and enterprise clients across five regions. We help clients turn AI from
              buzzword into roadmap — then we build from reputation, pairing senior strategy with a marketplace
              of trusted AI Managers.
            </p>
            <div className="mt-8 space-y-4">
              {values.map((v) => (
                <div key={v.title} className="flex gap-3.5">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-glow/10 ring-1 ring-cyan-glow/30">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-cyan-glow" fill="none">
                      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-display text-base font-600 text-white">{v.title}</h4>
                    <p className="mt-0.5 text-sm text-slate-400">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
