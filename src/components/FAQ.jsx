import { useState } from 'react'
import { Reveal, SectionHead } from './ui'

const faqs = [
  {
    q: 'What is Generative AI?',
    a: 'Generative AI is a class of artificial intelligence that creates new content — text, images, code, analysis, and more — from natural-language prompts. Tools like large language models learn patterns from vast datasets, then apply them to draft documents, answer questions and automate workflows. For businesses, it means that hours of work can be reduced to minutes.',
  },
  {
    q: 'How can AIM NOW help my business adopt AI?',
    a: 'We start with a discovery call and an AI readiness audit to find the opportunities that make sense for your business. From there we build a structured, ROI-driven roadmap and pair you with a trusted AI Manager from our network to deliver it, so strategy and execution live under one roof.',
  },
  {
    q: 'Do you build custom tools, or just advise?',
    a: 'Both. Beyond strategy, our AI Managers design and ship practical tools tailored to your workflow — from data-mining and enrichment engines to internal web apps. You get working software that fits how your team actually operates, not a generic off-the-shelf product.',
  },
  {
    q: 'Will I be locked into an AI platform?',
    a: 'No. We develop tools that your business owns outright, with no ongoing AI platform dependency and costs once delivered.',
  },
]

function Item({ q, a, open, onToggle }) {
  return (
    <div className="card card-hover">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <h3 className="font-display text-base font-600 text-white sm:text-lg">{q}</h3>
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 shrink-0 text-cyan-glow transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
          fill="none"
        >
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-slate-400 sm:text-base">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <section id="faq" className="relative py-20 md:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHead
            eyebrow="FAQ"
            title="Generative AI, answered"
            sub="What Generative AI is — and how AIM NOW turns it into practical value for your business."
          />
        </Reveal>

        <div className="mx-auto mt-14 max-w-3xl space-y-4">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.06}>
              <Item
                q={f.q}
                a={f.a}
                open={openIdx === i}
                onToggle={() => setOpenIdx((cur) => (cur === i ? -1 : i))}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
