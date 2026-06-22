import { Reveal, SectionHead } from './ui'

const cases = [
  {
    sector: 'Retail · SME',
    title: 'From spreadsheets to a forecasting engine',
    desc: 'A 6-week roadmap engagement followed by Portal-matched engineers shipping a demand-forecasting model.',
    metric: '32%',
    metricLabel: 'less overstock',
    region: 'UK',
  },
  {
    sector: 'FinServ · Enterprise',
    title: 'AI readiness audit across 4 business units',
    desc: 'Discovery and prioritisation surfaced 12 use cases; the top 3 went to delivery within the quarter.',
    metric: '£2.4M',
    metricLabel: 'projected annual value',
    region: 'EU',
  },
  {
    sector: 'Logistics · SME',
    title: 'Support automation that customers love',
    desc: 'Portal engineers built an LLM support assistant, managed end-to-end through the delivery dashboard.',
    metric: '4.8/5',
    metricLabel: 'CSAT after launch',
    region: 'ANZ',
  },
]

export default function CaseStudies() {
  return (
    <section id="cases" className="relative py-20 md:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHead
            eyebrow="Case studies"
            title="Outcomes we're proud of"
            sub="Strategy and delivery, working together — here's what that looks like in the field."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {cases.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <div className="card card-hover flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-glow/80">{c.sector}</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">
                    {c.region}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-600 leading-snug text-white">{c.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{c.desc}</p>
                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="font-display text-3xl font-700 text-gradient">{c.metric}</div>
                  <div className="mt-1 text-xs text-slate-400">{c.metricLabel}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center text-sm text-slate-500">
            <span>Trusted by teams across</span>
            {['UK', 'Europe', 'North America', 'ANZ', 'APAC'].map((r) => (
              <span key={r} className="font-display font-600 text-slate-300">{r}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
