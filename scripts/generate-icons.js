// Generates PWA PNG icons from an inline SVG using sharp.
// Run: npm run gen:icons
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pub = join(__dirname, '..', 'public')

// Bold gradient tile + knocked-out "A" — reads clearly from 16px favicon to 512px PWA icon.
const svg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#5fd0ff"/><stop offset="1" stop-color="#2b8cff"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#g)"/>
  <path d="M144 384 L256 112 L368 384 L304 384 L281.6 328 L230.4 328 L208 384 Z M248 272 L264 272 L256 240 Z"
        fill="#06101f" fill-rule="evenodd"/>
  <circle cx="256" cy="112" r="26" fill="#06101f"/>
</svg>`

const targets = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
]

for (const t of targets) {
  await sharp(Buffer.from(svg(t.size)))
    .png()
    .toFile(join(pub, t.name))
  console.log('wrote', t.name)
}
console.log('Icons generated.')
