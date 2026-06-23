// Generates favicon + PWA icons using the real "AI" lettering cropped
// from the brand wordmark, composited onto a navy rounded badge.
// Run: npm run gen:icons  (depends on public/aimnow-transparent.png,
// produced by scripts/make-logo-svg.js)
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { writeFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pub = join(__dirname, '..', 'public')

// "AI" crop within the transparent wordmark (measured from the column profile).
const AI = { left: 9, top: 0, width: 129, height: 195 }

const aiBuf = await sharp(join(pub, 'aimnow-transparent.png')).extract(AI).png().toBuffer()

// Small favicons need bigger letters + tighter corners to stay legible;
// large app icons keep a maskable-safe margin and rounder corners.
const scaleFor = (size) => (size <= 48 ? 0.82 : 0.62)
const radiusFor = (size) => (size <= 48 ? 0.16 : 0.22)

// Navy rounded badge with a soft central glow, sized to `size`.
const badgeSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="44%" r="62%">
      <stop offset="0" stop-color="#163a63"/>
      <stop offset="1" stop-color="#0a1628"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * radiusFor(size))}" fill="url(#glow)"/>
</svg>`

async function composeIcon(size) {
  const lh = Math.round(size * scaleFor(size))
  const lw = Math.round(lh * (AI.width / AI.height))
  const ai = await sharp(aiBuf).resize(lw, lh).png().toBuffer()
  return sharp(Buffer.from(badgeSvg(size)))
    .composite([{ input: ai, left: Math.round((size - lw) / 2), top: Math.round((size - lh) / 2) }])
    .png()
    .toBuffer()
}

const targets = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
]

for (const t of targets) {
  const buf = await composeIcon(t.size)
  writeFileSync(join(pub, t.name), buf)
  console.log('wrote', t.name)
}

// SVG favicon: navy rounded badge with the embedded "AI" crop. Browsers
// scale this down for tiny tabs, so use the larger small-size scale.
const lh = Math.round(512 * 0.82)
const lw = Math.round(lh * (AI.width / AI.height))
const aiHi = await sharp(aiBuf).resize(lw, lh).png().toBuffer()
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="AI">
  <defs>
    <radialGradient id="glow" cx="50%" cy="44%" r="62%">
      <stop offset="0" stop-color="#163a63"/>
      <stop offset="1" stop-color="#0a1628"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="82" fill="url(#glow)"/>
  <image href="data:image/png;base64,${aiHi.toString('base64')}" x="${Math.round((512 - lw) / 2)}" y="${Math.round((512 - lh) / 2)}" width="${lw}" height="${lh}"/>
</svg>
`
writeFileSync(join(pub, 'favicon.svg'), faviconSvg)
console.log('wrote favicon.svg')
console.log('Icons generated.')
