// Builds a transparent-background logo from the dark-backed brand PNG.
// The background is a near-uniform dark; we derive per-pixel alpha from
// each pixel's distance to that colour so the letters stay solid and the
// glow fades out softly. Output: a transparent PNG embedded in an SVG.

import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '..')
const SRC = path.join(root, 'public', 'aimnow-source.png')

const BG = [2, 6, 20] // sampled background (near-black)
const LO = 22 // distance <= LO  -> fully transparent (drops faint glow haze)
const HI = 85 // distance >= HI -> fully opaque (glow fades across LO..HI)
const MAX_W = 1000 // cap embedded asset width to keep the SVG lean

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
let minY = height, maxY = 0
const colInk = new Int32Array(width) // inked-pixel count per column
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
      colInk[x]++
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}

// Horizontal extent: keep columns whose ink height is a real letter stroke,
// not the thin circuit traces that trail off to the edges. (Threshold as a
// fraction of the content height.)
const contentH = maxY - minY + 1
const COL_THRESH = Math.max(3, contentH * 0.18)
let minX = width, maxX = 0
for (let x = 0; x < width; x++) {
  if (colInk[x] >= COL_THRESH) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
  }
}

// Crop to the letters plus a small, even margin for breathing room.
const PAD = 10
const left = Math.max(0, minX - PAD)
const top = Math.max(0, minY - PAD)
const right = Math.min(width - 1, maxX + PAD)
const bottom = Math.min(height - 1, maxY + PAD)
const cropW = right - left + 1
const cropH = bottom - top + 1

// Crop, then downscale if wider than MAX_W (keeps the asset retina-sharp
// at the logo's on-screen size without bloating the embedded base64).
const outW = Math.min(cropW, MAX_W)
const outH = Math.round(cropH * (outW / cropW))

const pngBuf = await sharp(data, { raw: { width, height, channels } })
  .extract({ left, top, width: cropW, height: cropH })
  .resize(outW, outH)
  .png()
  .toBuffer()

// Write a transparent PNG (for inspection) and an SVG that embeds it.
writeFileSync(path.join(root, 'public', 'aimnow-transparent.png'), pngBuf)

const b64 = pngBuf.toString('base64')
// viewBox only (no fixed width/height) so CSS `height + width:auto`
// resolves reliably for responsive sizing.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${outW} ${outH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="AIM NOW">
  <image href="data:image/png;base64,${b64}" width="${outW}" height="${outH}"/>
</svg>
`
writeFileSync(path.join(root, 'public', 'aimnow.svg'), svg)

console.log(`Wrote aimnow.svg (${(svg.length / 1024).toFixed(1)} KB) and aimnow-transparent.png at ${outW}x${outH} (ratio ${(outW / outH).toFixed(3)})`)
