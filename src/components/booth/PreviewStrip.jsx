import { getFrameLayout, getFooterY } from '../../data/frames'

export default function PreviewStrip({
  frame,
  photoUrls = [],
  overlays = [],
  filterCss = 'none',
}) {
  const layout = getFrameLayout(frame)
  const { width: cw, height: ch } = layout.canvas
  const pct = (v, total) => `${(v / total) * 100}%`
  const footerY = getFooterY(layout)

  return (
    <div
      className="@container relative h-full max-h-full w-auto max-w-full overflow-hidden rounded-md shadow-md"
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

      {layout.slots.map((slot, i) => (
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
          {photoUrls[i] && (
            <img
              src={photoUrls[i]}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: filterCss }}
            />
          )}
          {overlays[i] && (
            <img
              crossOrigin="anonymous"
              src={overlays[i].src}
              alt=""
              draggable="false"
              className="pointer-events-none absolute w-auto max-w-none"
              style={{
                right: `${overlays[i].right * 100}%`,
                bottom: `${overlays[i].bottom * 100}%`,
                height: `${overlays[i].height * 100}%`,
              }}
            />
          )}
        </div>
      ))}

      {!frame.frameImageUrl && footerY != null && (
        <div
          className="absolute inset-x-0 -translate-y-1/2 overflow-hidden text-center font-medium tracking-widest whitespace-nowrap"
          style={{
            top: pct(footerY, ch),
            color: frame.textColor,
            fontSize: `${(2800 / cw).toFixed(3)}cqw`,
          }}
        >
          {frame.footerText}
        </div>
      )}
    </div>
  )
}
