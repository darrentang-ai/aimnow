import { useEffect, useState } from 'react'
import Logo from './Logo'

const links = [
  { label: 'Services', href: '#services' },
  { label: 'Portal', href: '#portal' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
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

        <div className="hidden items-center gap-8 md:flex">
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

        <div className="hidden md:block">
          <a href="#portal" className="btn-primary !px-6 !py-2.5">
            Join the Portal
          </a>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 md:hidden"
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

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-white/10 bg-ink-900/95 backdrop-blur-xl transition-all duration-300 md:hidden ${
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
          <a href="#portal" onClick={() => setOpen(false)} className="btn-primary mt-2">
            Join the Portal
          </a>
        </div>
      </div>
    </header>
  )
}
