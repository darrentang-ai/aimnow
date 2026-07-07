import { motion } from 'framer-motion'

// Scroll-triggered reveal wrapper
export function Reveal({ children, delay = 0, y = 24, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Decorative animated circuit / glow background
export function CircuitBg({ className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-aim-blue/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-cyan-glow/10 blur-[100px] animate-pulseGlow" />
      <div className="absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-aim-blue/10 blur-[100px]" />
    </div>
  )
}

// Modern section eyebrow — an uppercase, wide-tracked cyan label with a
// subtle gradient accent line. Intentionally not a pill, so it doesn't
// read as a button. Flanking lines on both sides when centered.
export function Eyebrow({ children, center = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${center ? 'justify-center' : ''} ${className}`}>
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-glow/70" />
      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-glow">{children}</span>
      {center && <span className="h-px w-8 bg-gradient-to-l from-transparent to-cyan-glow/70" />}
    </div>
  )
}

// Section heading block
export function SectionHead({ eyebrow, title, sub, center = true }) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <Eyebrow center={center} className="mb-5">{eyebrow}</Eyebrow>}
      <h2 className="font-display text-3xl font-700 leading-tight text-white sm:text-4xl md:text-[2.75rem]">
        {title}
      </h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">{sub}</p>}
    </div>
  )
}
