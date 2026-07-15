import Logo from './Logo'

const groups = [
  { title: 'Company', links: [['About', '#about'], ['Projects', '#projects'], ['Contact', '#contact']] },
  {
    title: 'Services',
    links: [
      ['Consultancy', '#services'],
      ['AI Manager Portal', '#portal'],
      ['Become an AI Manager', '#contact', 'Become a trusted AI Manager'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-ink-900">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo className="h-10 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              AI strategy consultancy turning AI from buzzword into roadmap — and a marketplace of trusted
              AI Managers to build it.
            </p>
            <a href="#portal" className="btn-primary mt-6 !px-6 !py-2.5">
              Join the Portal
            </a>
          </div>

          {groups.map((g) => (
            <div key={g.title}>
              <h4 className="font-display text-sm font-600 text-white">{g.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {g.links.map(([label, href, interest]) => (
                  <li key={label}>
                    <a
                      href={href}
                      onClick={interest ? () => window.dispatchEvent(new CustomEvent('aimnow:interest', { detail: interest })) : undefined}
                      className="text-sm text-slate-400 transition-colors hover:text-cyan-glow"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} AIM NOW. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-slate-500">
            <a href="#" className="transition-colors hover:text-cyan-glow">Privacy</a>
            <a href="#" className="transition-colors hover:text-cyan-glow">Terms</a>
            <a href="#" className="transition-colors hover:text-cyan-glow">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
