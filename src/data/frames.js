// 기본 캔버스/슬롯 규격 — layout 데이터가 없는(구버전) 프레임의 폴백.
export const DEFAULT_CANVAS = { width: 600, height: 1900 }

export const DEFAULT_LAYOUT = {
  canvas: { ...DEFAULT_CANVAS },
  slots: buildDefaultSlots(),
}

function buildDefaultSlots() {
  const paddingX = 40
  const paddingTop = 60
  const width = 520
  const height = 390
  const gap = 20
  const slots = []
  for (let i = 0; i < 4; i++) {
    slots.push({
      x: paddingX,
      y: paddingTop + i * (height + gap),
      width,
      height,
      shape: 'rect',
      radius: 0,
    })
  }
  return slots
}

// 프레임의 layout을 안전하게 반환. 없거나 형식이 깨졌으면 기본 레이아웃.
export function getFrameLayout(frame) {
  const layout = frame?.layout
  if (
    layout &&
    layout.canvas &&
    Number.isFinite(layout.canvas.width) &&
    Number.isFinite(layout.canvas.height) &&
    Array.isArray(layout.slots) &&
    layout.slots.length > 0
  ) {
    return layout
  }
  return DEFAULT_LAYOUT
}

export function getSlotCount(frame) {
  return getFrameLayout(frame).slots.length
}

// 색상 프레임의 푸터 텍스트 y좌표 — 마지막 슬롯 아래 남는 공간의 중앙.
export function getFooterY(layout) {
  const bottom = layout.slots.reduce(
    (max, s) => Math.max(max, s.y + s.height),
    0,
  )
  return bottom + (layout.canvas.height - bottom) / 2
}
