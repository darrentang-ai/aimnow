import { motion } from 'framer-motion'
import { CircuitBg } from './ui'

export default function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-28 pb-20 md:pt-40 md:pb-28">
      <CircuitBg />

      <div className="container-x relative">
        <div className="mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="chip !px-5 !py-2.5 !text-sm sm:!text-base !normal-case !tracking-normal"
          >
            <span className="h-2 w-2 animate-pulseGlow rounded-full bg-cyan-glow" />
            AI Management and Consultancy
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 font-display text-4xl font-700 leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl"
          >
            Turn AI from buzzword
            <br className="hidden sm:block" /> into a real roadmap.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            AIM NOW helps small and medium-sized businesses cut through the hype, building on a foundation of
            trust and reputation. On one side, we offer strategic engagements; on the other, we provide
            access to a marketplace of trusted AI Managers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <a href="#portal" className="btn-primary w-full sm:w-auto !text-sm sm:!text-base">
              Join the AI Manager Portal
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#services" className="btn-ghost w-full sm:w-auto !text-sm sm:!text-base">
              Explore Consultancy
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
