import { useEffect } from 'react'
import { idToAngle } from '../../utils/idToAngle'

export default function PhotoModal({ photo, onClose }) {
  const tapeAngle = idToAngle(photo.id + 'tape', 4)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-xs flex-col items-center gap-4 sm:max-w-sm"
      >
        <div className="relative">
          {photo.tape && (
            <div
              className="pointer-events-none absolute left-1/2 top-0 z-10 w-36 sm:w-44"
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
            draggable="false"
            className="max-h-[80vh] w-auto rounded-md shadow-2xl"
          />
        </div>
        <button
          onClick={onClose}
          className="w-40 rounded-lg bg-neutral-300 px-6 py-2.5 text-sm font-semibold text-neutral-800 shadow-lg transition hover:bg-neutral-400"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
