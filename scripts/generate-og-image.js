// Generates the social share ("link preview") image: a 1200x630 card with
// the brand background, wordmark, and tagline. Run: node scripts/generate-og-image.js
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pub = join(__dirname, '..', 'public')

const W = 1200
const H = 630

const logoBuf = readFileSync(join(pub, 'aimnow-transparent.png'))
const logoW = 640
const logoH = Math.round(logoW * (139 / 1000))
const logo = await sharp(logoBuf).resize(logoW, logoH).png().toBuffer()

const bgSvg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="38%" r="65%">
      <stop offset="0" stop-color="#13294a"/>
      <stop offset="1" stop-color="#06101f"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
</svg>`

const textSvg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="600" fill="#cbd5e1">
    We match businesses with trusted AI Managers
  </text>
  <text x="50%" y="480" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" letter-spacing="4" fill="#3fc6ff">
    AI MANAGEMENT AND CONSULTANCY
  </text>
</svg>`

const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer()

const out = await sharp(bg)
  .composite([
    { input: logo, left: Math.round((W - logoW) / 2), top: 150 },
    { input: Buffer.from(textSvg), left: 0, top: 0 },
  ])
  .png()
  .toBuffer()

writeFileSync(join(pub, 'og-image.png'), out)
console.log(`Wrote og-image.png (${W}x${H}, ${(out.length / 1024).toFixed(1)} KB)`)
