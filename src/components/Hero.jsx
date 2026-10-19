import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Eyebrow } from './ui'

export default function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-28 pb-20 md:pt-40 md:pb-28">
      <div className="container-x relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Announcement, above everything else on the page. Not a bar above
              the navbar: that header is `fixed top-0`, so anything in normal
              flow above it renders underneath it. This sits at the top of the
              hero's own content instead, which is the first thing a reader
              actually sees.

              Scoped carefully to what the feature is — a thread between an
              account holder and AIM Now. It is NOT business-to-manager chat,
              which the Premium card still advertises and the Portal still
              cannot do. It also promises no reply time, since nothing notifies
              an admin until they next sign in. */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex justify-center"
          >
            <Link
              to="/portal"
              className="group relative isolate inline-flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1 overflow-hidden rounded-full border border-cyan-glow/25 bg-cyan-glow/5 px-4 py-1.5 text-xs transition-colors animate-pillGlow hover:border-cyan-glow/50 hover:bg-cyan-glow/10 motion-reduce:animate-none sm:text-sm"
            >
              {/* The glint. aria-hidden and pointer-events-none because it is
                  decoration — it must not be announced or swallow the click.
                  -z-10 under an `isolate` parent keeps it behind the text
                  without needing a z-index on every label.

                  Hidden outright under prefers-reduced-motion: a band of light
                  crossing the first thing on the page, every few seconds, is
                  exactly what that setting exists to stop. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -z-10 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-cyan-glow/30 to-transparent blur-[2px] motion-reduce:hidden"
              />
              <span className="font-semibold uppercase tracking-wider text-cyan-glow">New</span>
              {/* Arrow inside the text rather than beside it: as a sibling flex
                  item it wrapped onto a line of its own once the sentence broke
                  at phone width. */}
              <span className="text-slate-300">
                Message AIM Now from your dashboard{' '}
                <svg viewBox="0 0 24 24" className="inline h-3.5 w-3.5 shrink-0 align-[-0.1em] text-cyan-glow transition-transform group-hover:translate-x-0.5" fill="none">
                  <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <Eyebrow center size="lg">AI Management and Consultancy</Eyebrow>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 font-display text-4xl font-700 leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl"
          >
            Matching businesses with
            <br className="hidden sm:block" /> trusted AI Managers
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-4xl text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            We blend strategic insight with access to a network of Generative AI specialists, building
            tools you own — with no ongoing platform dependency or cost once delivered.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            {/* Names the outcome, not the mechanism — and it is the one action
                the Portal actually performs. The PWA install prompt that used
                to fire here now lives on the navbar's Sign in: a returning
                user is a better moment to offer it than a first-time visitor. */}
            <Link to="/portal" className="btn-primary w-full sm:w-auto !text-sm sm:!text-base">
              Post your first project free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a href="#services" className="btn-ghost w-full sm:w-auto !text-sm sm:!text-base">
              Explore Consultancy
            </a>
          </motion.div>

          {/* Above-the-fold proof, and the only pull toward #projects before
              three other sections. Hand-kept count — mirrors the note in
              Projects.jsx; update both if the work changes. */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-8 text-sm text-slate-400"
          >
            4 projects delivered for Astra Worldwide · Gaucín Properties · NetWise UK —{' '}
            <span className="text-cyan-glow">★★★★★</span> on every one.{' '}
            <a
              href="#projects"
              className="inline-flex items-center gap-1 font-semibold text-slate-300 transition-colors hover:text-cyan-glow"
            >
              See the work
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </motion.p>
        </div>
      </div>
    </section>
  )
}
