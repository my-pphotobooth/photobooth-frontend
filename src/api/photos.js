import { frames } from '../data/frames'

const MOCK_DELAY = 500
const DUMMY_COUNT = 6

let mockStore = []
let initialized = false

function delay(ms = MOCK_DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ensureInitialized() {
  if (initialized) return
  initialized = true
  mockStore = Array.from({ length: DUMMY_COUNT }, (_, i) => createDummyPhoto(i))
}

const DUMMY_PALETTES = [
  ['#fecaca', '#fed7aa', '#fde68a', '#d9f99d'],
  ['#a7f3d0', '#99f6e4', '#bae6fd', '#c7d2fe'],
  ['#ddd6fe', '#f5d0fe', '#fbcfe8', '#fecdd3'],
  ['#fef3c7', '#ecfccb', '#d1fae5', '#cffafe'],
  ['#fde68a', '#fecaca', '#f5d0fe', '#c7d2fe'],
  ['#bbf7d0', '#bae6fd', '#fbcfe8', '#fed7aa'],
]

function createDummyPhoto(index) {
  const frame = frames[index % frames.length]
  const colors = DUMMY_PALETTES[index % DUMMY_PALETTES.length]

  const slotsSvg = colors
    .map((c, i) => {
      const y = 60 + i * 410
      return `<rect x="40" y="${y}" width="520" height="390" fill="${c}"/>`
    })
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1800">
<rect width="600" height="1800" fill="${frame.backgroundColor}"/>
${slotsSvg}
<text x="300" y="1740" text-anchor="middle" fill="${frame.textColor}" font-size="28" font-weight="500" font-family="system-ui" style="letter-spacing: 4px">${frame.footerText}</text>
</svg>`

  return {
    id: `dummy-${index}`,
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    createdAt: new Date(Date.now() - index * 3_600_000).toISOString(),
  }
}

export async function uploadPhoto(blob) {
  ensureInitialized()
  console.log('[mock] uploadPhoto', `${(blob.size / 1024).toFixed(1)} KB`)
  await delay()
  const photo = {
    id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    url: URL.createObjectURL(blob),
    createdAt: new Date().toISOString(),
  }
  mockStore = [photo, ...mockStore]
  return photo
}

export async function fetchPhotos() {
  ensureInitialized()
  console.log('[mock] fetchPhotos →', mockStore.length)
  await delay(300)
  return [...mockStore]
}
