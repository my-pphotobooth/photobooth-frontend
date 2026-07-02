import { getFrameLayout, getFooterY } from '../../data/frames'

export default function FrameThumbnail({ frame }) {
  const layout = getFrameLayout(frame)
  const { width: cw, height: ch } = layout.canvas
  const pct = (v, total) => `${(v / total) * 100}%`
  const showOverlays = Array.isArray(frame.overlays) && frame.overlays.length > 0

  return (
    <div
      className="relative w-full overflow-hidden rounded-md shadow-md"
      style={{ aspectRatio: `${cw} / ${ch}`, backgroundColor: frame.backgroundColor }}
    >
      {frame.frameImageUrl && (
        <img
          crossOrigin="anonymous"
          src={frame.frameImageUrl}
          alt=""
          draggable="false"
          className="pointer-events-none absolute inset-0 h-full w-full object-fill"
        />
      )}

      {layout.slots.map((slot, i) => {
        const overlay = showOverlays ? frame.overlays?.[i] : null
        return (
          <div
            key={i}
            className="absolute overflow-hidden"
            style={{
              left: pct(slot.x, cw),
              top: pct(slot.y, ch),
              width: pct(slot.width, cw),
              height: pct(slot.height, ch),
              borderRadius:
                slot.shape === 'ellipse'
                  ? '50%'
                  : `${((slot.radius || 0) / slot.width) * 100}%`,
              backgroundColor: frame.slotColor,
            }}
          >
            {overlay && (
              <img
                crossOrigin="anonymous"
                src={overlay.src}
                alt=""
                draggable="false"
                className="pointer-events-none absolute w-auto"
                style={{
                  right: `${overlay.right * 100}%`,
                  bottom: `${overlay.bottom * 100}%`,
                  height: `${overlay.height * 100}%`,
                }}
              />
            )}
          </div>
        )
      })}

      {!frame.frameImageUrl && (
        <div
          className="absolute inset-x-0 -translate-y-1/2 text-center text-[8px] font-medium tracking-widest"
          style={{ top: pct(getFooterY(layout), ch), color: frame.textColor }}
        >
          {frame.footerText}
        </div>
      )}
    </div>
  )
}
