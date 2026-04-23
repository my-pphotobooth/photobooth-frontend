import { useMemo, useState } from 'react'
import { DEFAULT_FILTER_ID, filters, getFilterById } from '../../data/filters'
import PreviewStrip from './PreviewStrip'

export default function EditStep({ frame, photos, onDone }) {
  const [selectedIndices, setSelectedIndices] = useState([])
  const [filterId, setFilterId] = useState(DEFAULT_FILTER_ID)

  const photoUrls = useMemo(
    () => photos.map((blob) => URL.createObjectURL(blob)),
    [photos],
  )

  const filter = getFilterById(filterId)
  const previewUrls = selectedIndices.map((i) => photoUrls[i])
  const previewOverlays = selectedIndices.map(
    (i) => frame.overlays?.[i],
  )
  const canProceed = selectedIndices.length === 4

  function toggle(index) {
    setSelectedIndices((prev) => {
      const existing = prev.indexOf(index)
      if (existing !== -1) {
        return prev.filter((_, i) => i !== existing)
      }
      if (prev.length >= 4) return prev
      return [...prev, index]
    })
  }

  function handleNext() {
    if (!canProceed) return
    onDone({
      selectedIndices,
      filterId,
    })
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">편집</h2>
        <span className="text-xs text-neutral-500 sm:text-sm">
          마음에 드는 4장을 순서대로 골라주세요 ·{' '}
          <span className="font-medium text-neutral-800">
            {selectedIndices.length}/4
          </span>
        </span>
      </div>

      <div className="flex gap-3 sm:gap-5">
        <div className="w-20 shrink-0 sm:w-36">
          <PreviewStrip
            frame={frame}
            photoUrls={previewUrls}
            overlays={previewOverlays}
            filterCss={filter.css}
          />
        </div>

        <div className="flex-1">
          <PhotoGrid
            urls={photoUrls}
            frame={frame}
            selectedIndices={selectedIndices}
            onToggle={toggle}
            filterCss={filter.css}
          />
        </div>
      </div>

      <FilterTabs selectedId={filterId} onSelect={setFilterId} />

      <div className="flex justify-center pt-2">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="rounded-xl bg-neutral-900 px-10 py-3 text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-neutral-300 enabled:hover:bg-neutral-800"
        >
          다음
        </button>
      </div>
    </div>
  )
}

function PhotoGrid({ urls, frame, selectedIndices, onToggle, filterCss }) {
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {urls.map((url, i) => {
        const order = selectedIndices.indexOf(i)
        const isSelected = order !== -1
        const overlay = frame?.overlays?.[i]
        return (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className={`relative aspect-4/3 overflow-hidden rounded-md border-2 transition ${
              isSelected
                ? 'border-neutral-900'
                : 'border-transparent hover:border-neutral-300'
            }`}
          >
            <img
              src={url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: filterCss }}
            />
            {overlay && (
              <img
                src={overlay.src}
                alt=""
                draggable="false"
                className="pointer-events-none absolute w-auto"
                style={{
                  right: `${overlay.right * 100}%`,
                  bottom: `${overlay.bottom * 100}%`,
                  height: `${overlay.height * 100}%`,
                }}
              />
            )}
            {isSelected && (
              <div className="absolute inset-0 bg-black/20" />
            )}
            {isSelected && (
              <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white sm:h-6 sm:w-6 sm:text-xs">
                {order + 1}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function FilterTabs({ selectedId, onSelect }) {
  return (
    <div className="-mx-2 flex gap-1.5 overflow-x-auto px-2 py-1 sm:gap-2">
      {filters.map((f) => {
        const isSelected = f.id === selectedId
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition sm:px-4 sm:py-2 sm:text-sm ${
              isSelected
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
            }`}
          >
            {f.name}
          </button>
        )
      })}
    </div>
  )
}
