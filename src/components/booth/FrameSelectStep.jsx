import { useMemo, useState } from 'react'
import { getActiveFrames } from '../../data/frames'
import FrameThumbnail from './FrameThumbnail'

const CATEGORIES = [
  { id: 'basic', label: '기본', type: 'basic' },
  { id: 'gyeongmin', label: '경민', type: 'with-me' },
]

export default function FrameSelectStep({ onSelect }) {
  const [categoryId, setCategoryId] = useState('basic')
  const [selectedId, setSelectedId] = useState(null)

  const allFrames = useMemo(() => getActiveFrames(), [])
  const category = CATEGORIES.find((c) => c.id === categoryId)
  const framesInCategory = allFrames.filter((f) => f.type === category.type)
  const selected = framesInCategory.find((f) => f.id === selectedId)

  function handleCategoryChange(id) {
    setCategoryId(id)
    setSelectedId(null)
  }

  return (
    <div className="flex h-full flex-col gap-4 sm:gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          프레임 선택
        </h2>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
          마음에 드는 프레임을 골라주세요
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === categoryId
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`rounded-full border px-5 py-1.5 text-sm font-medium transition sm:px-6 sm:py-2 ${
                isActive
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {framesInCategory.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          지금은 준비된 {category.label} 프레임이 없어요
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6">
          {framesInCategory.map((frame) => {
            const isSelected = frame.id === selectedId
            return (
              <button
                key={frame.id}
                onClick={() => setSelectedId(frame.id)}
                className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition sm:p-3 ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-transparent hover:border-neutral-300'
                }`}
              >
                <div className="w-20 sm:w-24">
                  <FrameThumbnail frame={frame} />
                </div>
                <span className="text-xs font-medium text-neutral-800 sm:text-sm">
                  {frame.name}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-center pt-2">
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
