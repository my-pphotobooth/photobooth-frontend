// 기본 캔버스/슬롯 규격 — layout 데이터가 없는(구버전) 프레임의 폴백.
export const DEFAULT_CANVAS = { width: 600, height: 1900 }

export const DEFAULT_SHOT_COUNT = 8

export const DEFAULT_LAYOUT = {
  canvas: { ...DEFAULT_CANVAS },
  shotCount: DEFAULT_SHOT_COUNT,
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

// 촬영 시 사용할 사진 비율 = 프레임 슬롯의 가로/세로 비율.
// 촬영 미리보기와 저장본을 일치시켜 원치 않는 크롭을 막는다. 슬롯 없으면 4:3.
// (슬롯 비율이 제각각인 프레임은 첫 슬롯 기준)
export function getSlotAspect(frame) {
  const s = getFrameLayout(frame).slots[0]
  if (!s || !s.width || !s.height) return 4 / 3
  return s.width / s.height
}

// 촬영 횟수(촬영 풀 크기). 프레임이 지정한 shotCount를 쓰되,
// 없거나 슬롯 수보다 작으면 max(8, 슬롯수)로 폴백.
export function getShotCount(frame) {
  const layout = getFrameLayout(frame)
  const n = layout.shotCount
  if (Number.isInteger(n) && n >= layout.slots.length) return n
  return Math.max(DEFAULT_SHOT_COUNT, layout.slots.length)
}

// 푸터 텍스트가 들어갈 최소 하단 여백(캔버스 px). 이보다 좁으면 푸터 생략.
const MIN_FOOTER_BAND = 60

// 색상 프레임의 푸터 텍스트 y좌표 — 마지막 슬롯 아래 남는 공간의 중앙.
// 하단 여백이 부족하면(슬롯이 바닥까지 참) null → 푸터를 그리지 않는다.
export function getFooterY(layout) {
  const bottom = layout.slots.reduce(
    (max, s) => Math.max(max, s.y + s.height),
    0,
  )
  const band = layout.canvas.height - bottom
  if (band < MIN_FOOTER_BAND) return null
  return bottom + band / 2
}
