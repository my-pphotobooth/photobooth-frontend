export default function FrameThumbnail({ frame }) {
  const slotBg = frame.slotColor
  const showOverlays = Array.isArray(frame.overlays) && frame.overlays.length > 0

  return (
    <div
      className="flex aspect-2/6 w-full flex-col justify-between rounded-md p-2 shadow-md"
      style={{ backgroundColor: frame.backgroundColor }}
    >
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2, 3].map((i) => {
          const overlay = showOverlays ? frame.overlays?.[i] : null
          return (
            <div
              key={i}
              className="relative aspect-4/3 w-full overflow-hidden rounded-sm"
              style={{ backgroundColor: slotBg }}
            >
              {overlay && (
                <img
                  src={overlay.src}
                  alt=""
                  className="pointer-events-none absolute w-auto"
                  style={{
                    right: `${overlay.right * 100}%`,
                    bottom: `${overlay.bottom * 100}%`,
                    height: `${overlay.height * 100}%`,
                  }}
                  draggable="false"
                />
              )}
            </div>
          )
        })}
      </div>
      <div
        className="pt-1 text-center text-[8px] font-medium tracking-widest"
        style={{ color: frame.textColor }}
      >
        {frame.footerText}
      </div>
    </div>
  )
}
