const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')

const INK = [10, 10, 15]
const GOLD = [212, 165, 39]
const GOLD_LIGHT = [232, 193, 88]

function hexToRgb(hex) {
  return hex
}

function drawIcon(size, { maskable = false } = {}) {
  const png = new PNG({ width: size, height: size })
  const cx = size / 2
  const cy = size / 2
  // Safe zone for maskable icons: keep content within the inner 80% circle.
  const outerR = maskable ? size * 0.42 : size * 0.46
  const paperW = size * (maskable ? 0.4 : 0.46)
  const paperH = size * (maskable ? 0.5 : 0.58)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2
      let [r, g, b] = INK

      // Background circle (brand mark plate) — only for maskable safe padding look.
      const dx = x - cx
      const dy = y - cy
      const distFromCenter = Math.sqrt(dx * dx + dy * dy)

      // Receipt shape: rounded rectangle with a jagged/torn bottom edge.
      const px = x - (cx - paperW / 2)
      const py = y - (cy - paperH / 2)
      const insideRectX = px >= 0 && px <= paperW
      const insideRectY = py >= 0 && py <= paperH * 0.86
      let insideReceipt = insideRectX && insideRectY

      // Jagged bottom (zig-zag) for the receipt torn edge.
      if (insideRectX && !insideReceipt && py > 0 && py <= paperH) {
        const toothWidth = paperW / 8
        const toothIndex = Math.floor(px / toothWidth)
        const toothLocalX = px - toothIndex * toothWidth
        const toothPeak = toothIndex % 2 === 0 ? 0 : toothWidth * 0.6
        const edgeY = paperH * 0.86 + toothPeak - Math.abs(toothLocalX - toothWidth / 2) * 0.9
        if (py <= edgeY) insideReceipt = true
      }

      if (insideReceipt) {
        ;[r, g, b] = [244, 243, 236]
        // Lines on the receipt
        const lineSpacing = paperH * 0.14
        const lineY = py % lineSpacing
        const isLine = lineY < paperH * 0.045 && px > paperW * 0.18 && px < paperW * 0.82 && py > paperH * 0.12 && py < paperH * 0.72
        if (isLine) {
          ;[r, g, b] = GOLD
        }
      } else if (!maskable && distFromCenter > outerR) {
        // transparent-ish background outside the mark for non-maskable icon (kept solid ink for simplicity/compat)
        ;[r, g, b] = INK
      }

      png.data[idx] = r
      png.data[idx + 1] = g
      png.data[idx + 2] = b
      png.data[idx + 3] = 255
    }
  }

  return png
}

const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-512-maskable.png', size: 512, maskable: true },
]

for (const t of targets) {
  const png = drawIcon(t.size, { maskable: t.maskable })
  const buf = PNG.sync.write(png)
  fs.writeFileSync(path.join(outDir, t.file), buf)
  console.log('wrote', t.file)
}
