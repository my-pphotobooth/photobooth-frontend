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

// 촬영 인덱스에 대응하는 슬롯. 슬롯 수보다 많은 촬영(풀)은 순환.
// 어느 컷이 어느 슬롯에 들어갈지는 편집 단계에서 정해지므로 어디까지나 가정이다.
export function getSlotAt(frame, index) {
  const slots = getFrameLayout(frame).slots
  if (!slots.length) return null
  return slots[index % slots.length] ?? null
}

// 촬영 인덱스에 대응하는 슬롯의 가로/세로 비율.
// 슬롯마다 크기가 다른 프레임에서 각 컷을 해당 슬롯 비율로 촬영·미리보기하기 위함.
// 슬롯 없으면 4:3.
export function getSlotAspectAt(frame, index) {
  const s = getSlotAt(frame, index)
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

// ---- 오버레이 ----

export const OVERLAY_DEFAULTS = {
  src: '',
  anchor: 'slot',
  clip: true,
  right: 0,
  bottom: 0,
  height: 0.8,
}

function num(v, fallback) {
  return Number.isFinite(v) ? v : fallback
}

// 저장된 overlays를 정규화한다.
// 구버전 형식({src,right,bottom,height} 배열 = 배열 인덱스가 샷 번호)도 그대로 읽힌다.
export function normalizeOverlays(overlays) {
  if (!Array.isArray(overlays)) return []
  return overlays.flatMap((o, idx) => {
    if (!o || typeof o.src !== 'string' || !o.src) return []
    const anchor = o.anchor === 'canvas' ? 'canvas' : 'slot'
    return [
      {
        src: o.src,
        anchor,
        // 캔버스 앵커는 특정 샷에 묶이지 않는다
        shotIndex:
          anchor === 'canvas'
            ? null
            : Number.isInteger(o.shotIndex)
              ? o.shotIndex
              : idx,
        // 캔버스 앵커는 자를 슬롯 자체가 없다
        clip: anchor === 'slot' && o.clip !== false,
        right: num(o.right, 0),
        bottom: num(o.bottom, 0),
        height: num(o.height, OVERLAY_DEFAULTS.height),
      },
    ]
  })
}

export function getFrameOverlays(frame) {
  return normalizeOverlays(frame?.overlays)
}

// 해당 샷에 붙는 오버레이들. 배열 순서가 곧 겹쳐 그리는 순서.
export function getShotOverlays(frame, shotIndex) {
  return getFrameOverlays(frame).filter(
    (o) => o.anchor === 'slot' && o.shotIndex === shotIndex,
  )
}

// 슬롯과 무관하게 프레임 전체 좌표에 배치되는 오버레이들.
export function getCanvasOverlays(frame) {
  return getFrameOverlays(frame).filter((o) => o.anchor === 'canvas')
}

// 오버레이의 최종 배치를 캔버스 px로 계산.
// right/bottom은 "캔버스 우/하단에서의 거리"라 DOM(%)과 canvas 2d 양쪽에서 그대로 쓴다.
// 기준 사각형: slot 앵커면 그 슬롯, canvas 앵커(또는 슬롯 없음)면 캔버스 전체.
export function overlayBox(overlay, slot, canvas) {
  const base =
    overlay.anchor === 'canvas' || !slot
      ? { x: 0, y: 0, width: canvas.width, height: canvas.height }
      : slot
  return {
    height: overlay.height * base.height,
    right: canvas.width - (base.x + base.width) + overlay.right * base.width,
    bottom:
      canvas.height - (base.y + base.height) + overlay.bottom * base.height,
  }
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
