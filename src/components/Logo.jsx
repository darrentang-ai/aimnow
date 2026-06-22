// AIM NOW wordmark — recreates the brand artwork in SVG: glossy blue
// gradient letters with a beveled cyan edge, glow, circuit traces with
// glowing nodes, and the diamond accent on the right.

export default function Logo({ className = 'h-8 w-auto' }) {
  return (
    <svg
      viewBox="0 0 252 56"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AIM NOW"
    >
      <defs>
        {/* Glossy vertical face: bright highlight → cyan → deep blue */}
        <linearGradient id="aimFace" x1="0" y1="6" x2="0" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#cdefff" />
          <stop offset="0.45" stopColor="#5fd0ff" />
          <stop offset="1" stopColor="#1f6fd6" />
        </linearGradient>
        <linearGradient id="aimEdge" x1="0" y1="0" x2="252" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#aee9ff" />
          <stop offset="1" stopColor="#3fc6ff" />
        </linearGradient>
        <filter id="aimWordGlow" x="-15%" y="-40%" width="130%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="aimNodeGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Circuit traces sitting behind the letters */}
      <g stroke="url(#aimEdge)" strokeWidth="1" strokeLinecap="round" opacity="0.45">
        <path d="M8 14h14l4 4" />
        <path d="M70 44h10l4-4" />
        <path d="M120 12v8h8" />
        <path d="M176 46h12l3-3" />
        <path d="M214 16h10" />
      </g>
      <g fill="#9fe3ff" filter="url(#aimNodeGlow)">
        <circle cx="26" cy="18" r="1.6" />
        <circle cx="84" cy="40" r="1.6" />
        <circle cx="128" cy="20" r="1.6" />
        <circle cx="191" cy="43" r="1.6" />
        <circle cx="224" cy="16" r="1.6" />
      </g>

      {/* Wordmark */}
      <text
        x="4"
        y="42"
        filter="url(#aimWordGlow)"
        fill="url(#aimFace)"
        stroke="url(#aimEdge)"
        strokeWidth="0.6"
        style={{
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontWeight: 700,
          fontSize: '40px',
          letterSpacing: '1px',
        }}
      >
        AIM NOW
      </text>

      {/* Diamond accent on the right */}
      <g filter="url(#aimNodeGlow)">
        <path d="M242 22l4 6-4 6-4-6z" fill="#9fe3ff" />
      </g>
    </svg>
  )
}

// Circuit-node icon mark — used in compact contexts (PWA install banner).
export function LogoMark({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="aimGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5fd0ff" />
          <stop offset="1" stopColor="#2b8cff" />
        </linearGradient>
        <filter id="aimGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" stroke="url(#aimGrad)" strokeWidth="2.5" opacity="0.5" />
      <g filter="url(#aimGlow)" stroke="url(#aimGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* stylized 'A' / arrow-up = AIM */}
        <path d="M20 46 L32 18 L44 46" />
        <path d="M25 36 H39" />
      </g>
      {/* circuit nodes */}
      <circle cx="32" cy="18" r="3.5" fill="#5fd0ff" filter="url(#aimGlow)" />
      <circle cx="20" cy="46" r="3" fill="#2b8cff" />
      <circle cx="44" cy="46" r="3" fill="#2b8cff" />
      <path d="M44 46 H54 M10 46 H20" stroke="url(#aimGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}
