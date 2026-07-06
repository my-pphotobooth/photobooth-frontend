export default function WallPhoto({ photo, onClick }) {
  const angle = idToAngle(photo.id, 1.5)
  const tapeAngle = idToAngle(photo.id + 'tape', 4)

  return (
    <button
      onClick={onClick}
      className="group relative block transition hover:z-10 hover:scale-[1.02]"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      {photo.tape && (
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-10 w-20 sm:w-24 lg:w-28"
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
        className="h-72 w-auto rounded-sm bg-white shadow-[0_6px_20px_rgba(0,0,0,0.15)] sm:h-96 lg:h-112"
        draggable="false"
      />
    </button>
  )
}

export function idToAngle(id, range) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  // JS의 %는 음수에서 음수를 반환해서 한쪽으로 편향됨 → unsigned로 변환
  const unsigned = hash >>> 0
  const normalized = ((unsigned % 1000) / 1000 - 0.5) * 2 // -1..+1
  return normalized * range
}
