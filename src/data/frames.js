export const FRAME_WIDTH = 600
export const FRAME_HEIGHT = 1800
export const PHOTO_SLOT = {
  width: 520,
  height: 390,
  paddingX: 40,
  paddingTop: 60,
  gap: 20,
}

export function getSlotPositions() {
  const positions = []
  for (let i = 0; i < 4; i++) {
    positions.push({
      x: PHOTO_SLOT.paddingX,
      y: PHOTO_SLOT.paddingTop + i * (PHOTO_SLOT.height + PHOTO_SLOT.gap),
      width: PHOTO_SLOT.width,
      height: PHOTO_SLOT.height,
    })
  }
  return positions
}

const WITH_ME_POSES = [
  '/me/1.png',
  '/me/2.png',
  '/me/3.png',
  '/me/4.png',
]

const WITH_ME_POSITION = { right: 0, bottom: 0, height: 0.8 }

function buildWithMeOverlays(poses, shotCount = 8) {
  return Array.from({ length: shotCount }, (_, i) => ({
    src: poses[i % poses.length],
    ...WITH_ME_POSITION,
  }))
}

export const frames = [
  {
    id: 'basic-white',
    name: '기본 화이트',
    type: 'basic',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    footerText: 'my-photobooth',
  },
  {
    id: 'basic-black',
    name: '기본 블랙',
    type: 'basic',
    backgroundColor: '#18181b',
    textColor: '#f4f4f5',
    footerText: 'my-photobooth',
  },
  {
    id: 'with-me',
    name: 'with me',
    type: 'with-me',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    footerText: 'my-photobooth',
    overlays: buildWithMeOverlays(WITH_ME_POSES),
  },
]

export function getFrameById(id) {
  return frames.find((f) => f.id === id) ?? null
}

// availableFrom / availableUntil은 ISO 형식 문자열 (YYYY-MM-DD 또는 전체 ISO).
// availableFrom: 해당 시각부터 노출 (포함)
// availableUntil: 해당 시각까지 노출 (포함)
// 둘 다 없으면 항상 노출.
//
// 시즌 프레임 예시:
//   { id: 'with-me-summer', ...,
//     availableFrom: '2026-06-01',
//     availableUntil: '2026-08-31T23:59:59' }
export function isFrameActive(frame, now = Date.now()) {
  if (frame.availableFrom) {
    const from = Date.parse(frame.availableFrom)
    if (!Number.isNaN(from) && now < from) return false
  }
  if (frame.availableUntil) {
    const until = Date.parse(frame.availableUntil)
    if (!Number.isNaN(until) && now > until) return false
  }
  return true
}

export function getActiveFrames(now = Date.now()) {
  return frames.filter((f) => isFrameActive(f, now))
}
