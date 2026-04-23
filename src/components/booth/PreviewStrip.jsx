export default function PreviewStrip({ frame, photoUrls = [], filterCss = 'none' }) {
  const slots = [0, 1, 2, 3]
  return (
    <div
      className="flex aspect-2/6 w-full flex-col justify-between rounded-md p-2 shadow-md sm:p-3"
      style={{ backgroundColor: frame.backgroundColor }}
    >
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {slots.map((i) => (
          <div
            key={i}
            className="aspect-4/3 w-full overflow-hidden rounded-sm"
            style={{
              backgroundColor:
                frame.backgroundColor === '#ffffff' ? '#e5e7eb' : '#3f3f46',
            }}
          >
            {photoUrls[i] && (
              <img
                src={photoUrls[i]}
                alt=""
                className="h-full w-full object-cover"
                style={{ filter: filterCss }}
              />
            )}
          </div>
        ))}
      </div>
      <div
        className="pt-1 text-center text-[8px] font-medium tracking-widest sm:text-[10px]"
        style={{ color: frame.textColor }}
      >
        {frame.footerText}
      </div>
    </div>
  )
}
