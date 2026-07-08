import { useState } from 'react'
import { idToAngle } from '../../utils/idToAngle'

export default function WallPhoto({ photo, onClick }) {
  const angle = idToAngle(photo.id, 1.5)
  const tapeAngle = idToAngle(photo.id + 'tape', 4)
  // 실제 이미지 파일이 다 받아질 때까지 top-down(검은) 로딩을 감추고 pulse로 덮는다.
  const [loaded, setLoaded] = useState(false)

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
      <span className="relative block">
        <img
          src={photo.url}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`h-72 w-auto rounded-sm bg-white shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-opacity duration-300 sm:h-96 lg:h-112 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable="false"
        />
        {!loaded && (
          <span className="absolute inset-0 animate-pulse rounded-sm bg-gray-200" />
        )}
      </span>
    </button>
  )
}
