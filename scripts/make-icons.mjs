import { writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const res = path.join('android', 'app', 'src', 'main', 'res')
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }

const BG_DARK = '#17123A'
const BG_LIGHT = '#3D2A91'
const STAR = '#FFB703'

function starPath(cx, cy, outer, inner, points = 5) {
  const coords = []
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (Math.PI / points) * i - Math.PI / 2
    coords.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`)
  }
  return `M${coords.join(' L')} Z`
}

/** Иконка целиком: фон плюс звезда. */
function launcherSvg(size) {
  const star = starPath(size / 2, size / 2 + size * 0.02, size * 0.34, size * 0.15)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BG_LIGHT}"/>
      <stop offset="1" stop-color="${BG_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  <path d="${star}" fill="${STAR}"/>
</svg>`
}

/** Передний слой адаптивной иконки: звезда внутри безопасной зоны. */
function foregroundSvg(size) {
  const star = starPath(size / 2, size / 2, size * 0.24, size * 0.105)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <path d="${star}" fill="${STAR}"/>
</svg>`
}

function splashSvg(width, height) {
  const size = Math.min(width, height)
  const star = starPath(width / 2, height / 2, size * 0.14, size * 0.062)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.25" r="0.9">
      <stop offset="0" stop-color="#241A5C"/>
      <stop offset="1" stop-color="${BG_DARK}"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <path d="${star}" fill="${STAR}"/>
</svg>`
}

async function png(svg, file) {
  await sharp(Buffer.from(svg)).png().toFile(file)
  console.log('готово:', file)
}

async function roundIcon(size, file) {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  )
  const base = await sharp(Buffer.from(launcherSvg(size))).png().toBuffer()
  await sharp(base)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(file)
  console.log('готово:', file)
}

for (const [density, scale] of Object.entries(densities)) {
  const dir = path.join(res, `mipmap-${density}`)
  await png(launcherSvg(Math.round(48 * scale)), path.join(dir, 'ic_launcher.png'))
  await roundIcon(Math.round(48 * scale), path.join(dir, 'ic_launcher_round.png'))
  await png(foregroundSvg(Math.round(108 * scale)), path.join(dir, 'ic_launcher_foreground.png'))
}

await writeFile(
  path.join(res, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG_DARK}</color>\n</resources>\n`,
  'utf8',
)
console.log('готово: цвет фона иконки')

// Экран запуска: тот же тёмный фон, чтобы не мигало белым.
const splashTargets = [
  ['drawable', 1080, 1920],
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280],
]

for (const [dir, width, height] of splashTargets) {
  const target = path.join(res, dir)
  if (!existsSync(target)) continue
  await png(splashSvg(width, height), path.join(target, 'splash.png'))
}
