export default function FrameThumbnail({ frame }) {
  return (
    <div
      className="flex aspect-2/6 w-full flex-col justify-between rounded-md p-2 shadow-md"
      style={{ backgroundColor: frame.backgroundColor }}
    >
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-4/3 w-full rounded-sm"
            style={{
              backgroundColor:
                frame.backgroundColor === '#ffffff' ? '#e5e7eb' : '#3f3f46',
            }}
          />
        ))}
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
