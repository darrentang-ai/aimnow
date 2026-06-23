// Builds a transparent-background logo from the navy-backed brand PNG.
// The background is a uniform navy; we derive per-pixel alpha from each
// pixel's distance to that navy so the letters stay solid and the glow
// fades out softly. Output: a transparent PNG embedded in an SVG wrapper.

import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '..')
const SRC = path.join(root, 'public', 'aimnow.png')

const BG = [10, 33, 63] // sampled background navy
const LO = 8 // distance <= LO  -> fully transparent
const HI = 60 // distance >= HI -> fully opaque (glow fades across LO..HI)

const smoothstep = (lo, hi, x) => {
  const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)))
  return t * t * (3 - 2 * t)
}

const { data, info } = await sharp(SRC).raw().ensureAlpha().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info

// Key out the background and, in the same pass, find the tight bounding
// box of the visible (inked) pixels so we can crop away the uneven
// transparent margins that make the wordmark look vertically stretched.
const TRIM_ALPHA = 40
let minX = width, minY = height, maxX = 0, maxY = 0
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels
    const dr = data[i] - BG[0]
    const dg = data[i + 1] - BG[1]
    const db = data[i + 2] - BG[2]
    const dist = Math.sqrt(dr * dr + dg * dg + db * db)
    const a = Math.round(255 * smoothstep(LO, HI, dist))
    data[i + 3] = a
    if (a > TRIM_ALPHA) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}

// Crop to the letters plus a small, even margin for breathing room.
const PAD = 8
const left = Math.max(0, minX - PAD)
const top = Math.max(0, minY - PAD)
const cropW = Math.min(width, maxX + PAD) - left + 1
const cropH = Math.min(height, maxY + PAD) - top + 1

const pngBuf = await sharp(data, { raw: { width, height, channels } })
  .extract({ left, top, width: cropW, height: cropH })
  .png()
  .toBuffer()

// Write a transparent PNG (for inspection) and an SVG that embeds it.
writeFileSync(path.join(root, 'public', 'aimnow-transparent.png'), pngBuf)

const b64 = pngBuf.toString('base64')
// viewBox only (no fixed width/height) so CSS `height + width:auto`
// resolves reliably for responsive sizing.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cropW} ${cropH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="AIM NOW">
  <image href="data:image/png;base64,${b64}" width="${cropW}" height="${cropH}"/>
</svg>
`
writeFileSync(path.join(root, 'public', 'aimnow.svg'), svg)

console.log(`Wrote aimnow.svg (${(svg.length / 1024).toFixed(1)} KB) and aimnow-transparent.png at ${cropW}x${cropH} (ratio ${(cropW / cropH).toFixed(3)})`)
