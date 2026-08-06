import { useEffect, useState } from 'react'
import Logo from './Logo'
import { DISCOVERY_INTEREST } from './DiscoveryCTA'

const links = [
  { label: 'Services', href: '#services' },
  { label: 'Portal', href: '#portal' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-ink-900/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between md:h-20">
        <a href="#top" className="transition-opacity hover:opacity-80">
          <Logo className="h-8 w-auto md:h-11" />
        </a>

        {/* Desktop nav appears at lg, not md: the wordmark is ~317px wide, so the
            logo + six links + CTA don't fit until ~965px. Below that, hamburger. */}
        <div className="hidden items-center gap-6 lg:flex xl:gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-cyan-glow"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:block">
          <a
            href="#contact"
            onClick={() => window.dispatchEvent(new CustomEvent('aimnow:interest', { detail: DISCOVERY_INTEREST }))}
            className="btn-primary whitespace-nowrap !px-6 !py-2.5"
          >
            Book your free call
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-5 bg-white transition-all ${open ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-white transition-all ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-white transition-all ${open ? '-translate-y-2 -rotate-45' : ''}`} />
          </div>
        </button>
      </nav>

      {/* Mobile menu. The open cap (32rem = 512px) must stay above the panel's
          natural height — currently ~400px for 6 links plus the CTA — or
          overflow-hidden crops the last item. Raise it if more links are added. */}
      <div
        className={`overflow-hidden border-t border-white/10 bg-ink-900/95 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          open ? 'max-h-[32rem]' : 'max-h-0 border-transparent'
        }`}
      >
        <div className="container-x flex flex-col gap-1 py-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-cyan-glow"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => {
              setOpen(false)
              window.dispatchEvent(new CustomEvent('aimnow:interest', { detail: DISCOVERY_INTEREST }))
            }}
            className="btn-primary mt-2"
          >
            Book your free call
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  )
}
