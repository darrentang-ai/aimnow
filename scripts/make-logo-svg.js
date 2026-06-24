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
const LO = 68 // distance <= LO  -> fully transparent (drops haze + faint traces)
const HI = 110 // distance >= HI -> fully opaque (tight glow fades across LO..HI)
const MAX_W = 1000 // cap embedded asset width to keep the SVG lean
const TRIM_ALPHA = 40 // alpha above this counts as "inked"
const MIN_AREA = 300 // components smaller than this are decorative traces, not letters

const smoothstep = (lo, hi, x) => {
  const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)))
  return t * t * (3 - 2 * t)
}

const { data, info } = await sharp(SRC).raw().ensureAlpha().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info

// Pass 1: key out the background — alpha from distance to the bg colour.
for (let i = 0; i < data.length; i += channels) {
  const dr = data[i] - BG[0]
  const dg = data[i + 1] - BG[1]
  const db = data[i + 2] - BG[2]
  const dist = Math.sqrt(dr * dr + dg * dg + db * db)
  data[i + 3] = Math.round(255 * smoothstep(LO, HI, dist))
}

// Trim to the dense letter band first: the circuit traces under "A"/"W"
// are joined to the letter feet by thin bridges. The row profile shows a
// clear gap between the letters and the sparse trace rows below — zero
// everything outside that band, which severs the bridges.
const rowInk = new Int32Array(height)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * channels + 3] > 120) rowInk[y]++
  }
}
const rowMax = Math.max(...rowInk)
const DENSE = rowMax * 0.08 // a "letter" row; feet taper but stay above this
const GAP_RUN = 4 // consecutive sparse rows that mark the end of the letters
let bandTop = 0
while (bandTop < height && rowInk[bandTop] <= DENSE) bandTop++
let bandBottom = bandTop, gap = 0
for (let y = bandTop + 1; y < height; y++) {
  if (rowInk[y] > DENSE) { bandBottom = y; gap = 0 }
  else if (++gap >= GAP_RUN) break
}
for (let y = 0; y < height; y++) {
  if (y < bandTop || y > bandBottom) {
    for (let x = 0; x < width; x++) data[(y * width + x) * channels + 3] = 0
  }
}

// Then remove small disconnected components. Run after the band trim so
// that remnants orphaned by severing a bridge (e.g. a node dot left above
// the baseline) become their own small islands and get erased too.
// Label 8-connected components of inked pixels; erase any below MIN_AREA.
const label = new Int32Array(width * height).fill(-1)
const stack = []
for (let p = 0; p < width * height; p++) {
  if (data[p * channels + 3] <= TRIM_ALPHA || label[p] !== -1) continue
  const members = []
  label[p] = p
  stack.push(p)
  while (stack.length) {
    const q = stack.pop()
    members.push(q)
    const qx = q % width, qy = (q / width) | 0
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = qx + dx, ny = qy + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const n = ny * width + nx
        if (label[n] === -1 && data[n * channels + 3] > TRIM_ALPHA) {
          label[n] = p
          stack.push(n)
        }
      }
    }
  }
  if (members.length < MIN_AREA) {
    for (const m of members) data[m * channels + 3] = 0
  }
}

// Pass 2: bounding box + per-column ink profile on the cleaned alpha.
let minY = height, maxY = 0
const colInk = new Int32Array(width)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * channels + 3] > TRIM_ALPHA) {
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
