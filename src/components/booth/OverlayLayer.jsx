import { overlayBox } from '../../data/frames'

const IMG_CLASS = 'pointer-events-none absolute w-auto max-w-none'

// 슬롯 div 안쪽에 그리는 오버레이. 슬롯 기준 %라 부모의 overflow-hidden에 잘린다.
export function SlotOverlays({ overlays = [] }) {
  return overlays
    .filter((o) => o.clip)
    .map((o, i) => (
      <img
        key={`${o.src}-${i}`}
        crossOrigin="anonymous"
        src={o.src}
        alt=""
        draggable="false"
        className={IMG_CLASS}
        style={{
          right: `${o.right * 100}%`,
          bottom: `${o.bottom * 100}%`,
          height: `${o.height * 100}%`,
        }}
      />
    ))
}

// 캔버스 전체를 덮는 최상단 레이어.
// 슬롯 밖으로 삐져나가는 오버레이(clip=false)와 캔버스 앵커 오버레이를 그린다.
// 슬롯 div 바깥에 있어야 잘리지 않으므로 프레임 컨테이너 직속으로 둔다.
export function OverlayLayer({ layout, slotOverlays = [], canvasOverlays = [] }) {
  const { canvas, slots } = layout
  const items = [
    ...slotOverlays.flatMap((list, i) =>
      (list ?? [])
        .filter((o) => !o.clip)
        .map((o) => ({ overlay: o, slot: slots[i] })),
    ),
    ...canvasOverlays.map((o) => ({ overlay: o, slot: null })),
  ]

  return items.map(({ overlay, slot }, i) => {
    const box = overlayBox(overlay, slot, canvas)
    return (
      <img
        key={`${overlay.src}-${i}`}
        crossOrigin="anonymous"
        src={overlay.src}
        alt=""
        draggable="false"
        className={IMG_CLASS}
        style={{
          right: `${(box.right / canvas.width) * 100}%`,
          bottom: `${(box.bottom / canvas.height) * 100}%`,
          height: `${(box.height / canvas.height) * 100}%`,
        }}
      />
    )
  })
}
