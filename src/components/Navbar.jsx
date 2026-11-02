import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { hasSession } from '../lib/session'

// Every item here is an in-page anchor, and that consistency is the point: a
// nav where one link scrolls and another leaves the site — to a sign-in wall,
// in the Academy's case — asks people to guess which is which. The Academy is
// reached from the dashboards, where the members who can open it already are.
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
  // Read on mount. Navigating to /portal unmounts the whole landing page, so
  // coming back re-reads and the label stays honest after a sign-out.
  const [signedIn] = useState(hasSession)
  const portalLabel = signedIn ? 'Go to Portal' : 'Sign in'

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
      <nav className="container-x flex h-16 items-center justify-between lg:h-20">
        <a href="#top" className="transition-opacity hover:opacity-80">
          <Logo className="h-8 w-auto lg:h-11" />
        </a>

        {/* lg, not md. The full row — logo, six links and the CTA — needs a
            little over 950px, so between 768 and roughly 960 it overflowed the
            container and pushed the CTA off the edge. That was true before the
            links changed; the burger simply has to cover tablets too. */}
        <div className="hidden items-center gap-8 lg:flex">
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

        {/* Access, not acquisition — the hero carries the acquisition CTA, and
            until now a returning user had no route back to their projects. */}
        <div className="hidden lg:block">
          <Link to="/portal" className="btn-primary !px-6 !py-2.5">
            {portalLabel}
          </Link>
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

      {/* Collapsed menu — phones and tablets, up to lg. */}
      <div
        className={`overflow-hidden border-t border-white/10 bg-ink-900/95 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          open ? 'max-h-96' : 'max-h-0 border-transparent'
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
          <Link to="/portal" onClick={() => setOpen(false)} className="btn-primary mt-2">
            {portalLabel}
          </Link>
        </div>
      </div>
    </header>
  )
}
