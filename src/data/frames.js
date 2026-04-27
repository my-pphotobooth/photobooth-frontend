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
