import Logo from '../components/Logo'

// A stylised certificate with the name blurred: the thing at the end, shown
// before it is earned. Decorative, so hidden from assistive tech. Shared by the
// portal card and the certificate screen; imports nothing but the logo, so the
// portal bundle stays free of the course content.
export default function CertificatePreview({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`w-52 shrink-0 rotate-2 rounded-xl border border-cyan-glow/25 bg-gradient-to-b from-aim-blue/15 to-ink-900 p-4 text-center shadow-glow ${className}`}
    >
      <Logo className="mx-auto h-3.5 w-auto" />
      <p className="mt-3 text-[8px] font-semibold uppercase tracking-[0.2em] text-cyan-glow">Certificate of completion</p>
      <p className="mt-3 text-[9px] text-slate-500">This certifies that</p>
      <p className="mt-1 select-none font-display text-sm font-700 text-white blur-[5px]">Your Name Here</p>
      <p className="mt-2 text-[9px] text-slate-500">has completed</p>
      <p className="mt-0.5 font-display text-[11px] font-700 text-white">Generative AI Fundamentals</p>
      <div className="mt-3 border-t border-white/10 pt-2 text-[8px] uppercase tracking-wider text-slate-500">
        AIM Now Academy
      </div>
    </div>
  )
}
