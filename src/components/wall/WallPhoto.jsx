export default function WallPhoto({ photo, onClick }) {
  const angle = idToAngle(photo.id, 1.5)
  const tapeAngle = idToAngle(photo.id + 'tape', 4)

  return (
    <button
      onClick={onClick}
      className="group relative block w-full transition hover:z-10 hover:scale-[1.02]"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      {photo.tape && (
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-10 w-[80%]"
          style={{ transform: `translate(-50%, -50%) rotate(${tapeAngle}deg)` }}
        >
          <img
            src={photo.tape.url}
            alt=""
            draggable="false"
            className="block w-full drop-shadow-sm"
          />
        </div>
      )}
      <img
        src={photo.url}
        alt=""
        className="w-full rounded-sm bg-white shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
        draggable="false"
      />
    </button>
  )
}

function idToAngle(id, range) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  const normalized = ((hash % 1000) / 1000 - 0.5) * 2
  return normalized * range
}
