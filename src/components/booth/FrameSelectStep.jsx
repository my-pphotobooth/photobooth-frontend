import { useEffect, useMemo, useState } from 'react'
import { fetchFrames, fetchFrameCategories } from '../../api/frames'
import { fetchBasicLayouts } from '../../api/basicFrames'
import { basicFrameBase, withChip } from '../../data/basicFrame'
import { getFrameLayout } from '../../data/frames'
import FrameThumbnail from './FrameThumbnail'

export default function FrameSelectStep({ onSelectedChange, colorChips = [] }) {
  const [categories, setCategories] = useState([])
  const [frames, setFrames] = useState([])
  const [basicLayouts, setBasicLayouts] = useState([])
  const [status, setStatus] = useState('loading')
  const [categoryId, setCategoryId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cats, frs, layouts] = await Promise.all([
          fetchFrameCategories(),
          fetchFrames(),
          fetchBasicLayouts(),
        ])
        if (cancelled) return
        setCategories(cats)
        setFrames(frs)
        setBasicLayouts(layouts)
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

  const category = categories.find((c) => c.id === categoryId)
  const defaultChip = colorChips[0] ?? null

  // 기본 카테고리는 규격(레이아웃)을 대표 칩색으로 그린 frame으로, 나머지는 DB 프레임.
  const items = useMemo(() => {
    if (category?.isBasic) {
      return basicLayouts.map((l) => withChip(basicFrameBase(l), defaultChip))
    }
    return frames.filter((f) => f.categoryId === categoryId)
  }, [category, basicLayouts, frames, categoryId, defaultChip])

  function handleCategoryChange(id) {
    setCategoryId(id)
    setSelectedId(null)
    onSelectedChange?.(null)
  }

  function handleFrameClick(frame) {
    setSelectedId(frame.id)
    onSelectedChange?.(frame)
  }

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-500">
        프레임을 불러오는 중...
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
              type="button"
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

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          지금은 준비된 {category?.name ?? ''} 프레임이 없어요
        </div>
      ) : (
        <div className="-mx-4 grid auto-cols-max grid-flow-col justify-center-safe gap-4 overflow-x-auto px-4 py-4 snap-x snap-mandatory sm:-mx-6 sm:min-h-0 sm:flex-1 sm:grid-rows-1 sm:gap-6 sm:px-6">
          {items.map((frame) => {
            const isSelected = frame.id === selectedId
            const layout = getFrameLayout(frame)
            const aspect = layout.canvas.width / layout.canvas.height
            return (
              // 버튼(그리드 아이템)에 직접 aspect-ratio → 폭이 안 무너짐.
              // 라벨도 버튼 안에 두어 선택 박스가 라벨까지 감싸도록.
              <button
                key={frame.id}
                type="button"
                onClick={() => handleFrameClick(frame)}
                style={{ aspectRatio: aspect }}
                className={`group flex h-44 w-auto snap-center flex-col items-center justify-center gap-2 rounded-xl p-2 transition sm:h-full sm:gap-3 sm:p-3 ${
                  isSelected
                    ? 'bg-neutral-50 ring-2 ring-neutral-300'
                    : 'hover:bg-neutral-50'
                }`}
              >
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <FrameThumbnail frame={frame} heightClass="h-full" />
                </div>
                <span className="shrink-0 whitespace-nowrap text-xs font-medium text-neutral-800 sm:text-sm">
                  {frame.name}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
