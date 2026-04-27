import { useEffect, useMemo, useState } from 'react'
import { fetchFrames, fetchFrameCategories } from '../../api/frames'
import FrameThumbnail from './FrameThumbnail'

export default function FrameSelectStep({ onSelect }) {
  const [categories, setCategories] = useState([])
  const [frames, setFrames] = useState([])
  const [status, setStatus] = useState('loading')
  const [categoryId, setCategoryId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cats, frs] = await Promise.all([
          fetchFrameCategories(),
          fetchFrames(),
        ])
        if (cancelled) return
        setCategories(cats)
        setFrames(frs)
        setCategoryId(cats[0]?.id ?? null)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        console.error(err)
        setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const framesInCategory = useMemo(
    () => frames.filter((f) => f.categoryId === categoryId),
    [frames, categoryId],
  )
  const category = categories.find((c) => c.id === categoryId)
  const selected = framesInCategory.find((f) => f.id === selectedId)

  function handleCategoryChange(id) {
    setCategoryId(id)
    setSelectedId(null)
  }

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-500">
        프레임을 불러오는 중…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-600">
        프레임을 불러오지 못했어요
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 sm:gap-6">
      <div className="text-center">
        <h2 className="text-lg font-bold text-neutral-900 sm:text-2xl">
          프레임 선택
        </h2>
        <p className="mt-1 hidden text-xs text-neutral-500 sm:block sm:text-sm">
          마음에 드는 프레임을 골라주세요
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {categories.map((cat) => {
          const isActive = cat.id === categoryId
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`rounded-full border px-4 py-1 text-xs font-medium transition sm:px-6 sm:py-2 sm:text-sm ${
                isActive
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
              }`}
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      {framesInCategory.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          지금은 준비된 {category?.name ?? ''} 프레임이 없어요
        </div>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          {framesInCategory.map((frame) => {
            const isSelected = frame.id === selectedId
            return (
              <button
                key={frame.id}
                onClick={() => setSelectedId(frame.id)}
                className={`group flex w-24 flex-none snap-center flex-col items-center gap-2 rounded-xl border-2 p-2 transition sm:w-36 sm:p-3 ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-transparent hover:border-neutral-300'
                }`}
              >
                <FrameThumbnail frame={frame} />
                <span className="text-xs font-medium text-neutral-800 sm:text-sm">
                  {frame.name}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-center">
        <button
          disabled={!selected}
          onClick={() => onSelect(selected)}
          className="rounded-xl bg-neutral-900 px-10 py-3 text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-neutral-300 enabled:hover:bg-neutral-800"
        >
          다음
        </button>
      </div>
    </div>
  )
}
