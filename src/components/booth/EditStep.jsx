import { useEffect, useState } from 'react'
import { DEFAULT_FILTER_ID, filters, getFilterById } from '../../data/filters'
import { getSlotCount } from '../../data/frames'
import { withChip } from '../../data/basicFrame'
import PreviewStrip from './PreviewStrip'

export default function EditStep({ frame, photos, onDraftChange, colorChips = [] }) {
  const slotCount = getSlotCount(frame)
  const [selectedIndices, setSelectedIndices] = useState([])
  const [filterId, setFilterId] = useState(DEFAULT_FILTER_ID)
  const [colorChipId, setColorChipId] = useState(null)
  const [photoUrls, setPhotoUrls] = useState([])

  // 기본 프레임일 때만 컬러칩 사용. 미선택이면 첫 칩을 기본값으로.
  const showChips = frame.isBasic && colorChips.length > 0
  const selectedChip = showChips
    ? (colorChips.find((c) => c.id === colorChipId) ?? colorChips[0])
    : null
  const effectiveFrame = selectedChip ? withChip(frame, selectedChip) : frame

  useEffect(() => {
    const urls = photos.map((blob) => URL.createObjectURL(blob))
    // StrictMode의 가짜 unmount에서도 새 URL을 만들도록 effect 안에서 setState
    // eslint-disable-next-line
    setPhotoUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos])

  const filter = getFilterById(filterId)
  const previewUrls = selectedIndices.map((i) => photoUrls[i])
  const previewOverlays = selectedIndices.map((i) => frame.overlays?.[i])
  const canProceed = selectedIndices.length === slotCount

  useEffect(() => {
    onDraftChange?.({
      selectedIndices,
      filterId,
      colorChipId: selectedChip?.id ?? null,
      canProceed,
    })
  }, [selectedIndices, filterId, selectedChip?.id, canProceed, onDraftChange])

  function toggle(index) {
    setSelectedIndices((prev) => {
      const existing = prev.indexOf(index)
      if (existing !== -1) {
        return prev.filter((_, i) => i !== existing)
      }
      if (prev.length >= slotCount) return prev
      return [...prev, index]
    })
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex shrink-0 flex-col sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">편집</h2>
        <span className="text-xs text-neutral-500 sm:text-sm">
          마음에 드는 {slotCount}장을 순서대로 골라주세요 ·{' '}
          <span className="font-medium text-neutral-800">
            {selectedIndices.length}/{slotCount}
          </span>
        </span>
      </div>

      <div className="flex items-stretch gap-4 lg:min-h-0 lg:flex-1">
        <div className="w-28 shrink-0 sm:w-40 lg:h-full lg:w-auto">
          <PreviewStrip
            frame={effectiveFrame}
            photoUrls={previewUrls}
            overlays={previewOverlays}
            filterCss={filter.css}
          />
        </div>

        <div className="min-w-0 flex-1">
          <PhotoGrid
            urls={photoUrls}
            frame={frame}
            selectedIndices={selectedIndices}
            onToggle={toggle}
            filterCss={filter.css}
          />
        </div>
      </div>

      {showChips && (
        <ColorChipTabs
          chips={colorChips}
          selectedId={selectedChip?.id}
          onSelect={setColorChipId}
        />
      )}

      <FilterTabs selectedId={filterId} onSelect={setFilterId} />
    </div>
  )
}

function ColorChipTabs({ chips, selectedId, onSelect }) {
  return (
    <div className="-mx-2 flex shrink-0 items-center gap-2 overflow-x-auto px-2 py-1">
      {chips.map((chip) => {
        const isSelected = chip.id === selectedId
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.id)}
            title={chip.name}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition ${
              isSelected
                ? 'border-neutral-900 bg-neutral-100'
                : 'border-neutral-300 bg-white hover:border-neutral-500'
            }`}
          >
            <span
              className="h-5 w-5 rounded-full border border-neutral-300"
              style={{ backgroundColor: chip.backgroundColor }}
            />
            <span className="pr-1 text-neutral-700">{chip.name}</span>
          </button>
        )
      })}
    </div>
  )
}

function PhotoGrid({ urls, frame, selectedIndices, onToggle, filterCss }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:h-full lg:auto-cols-max lg:grid-cols-none lg:grid-flow-col lg:grid-rows-2 lg:gap-3 lg:overflow-x-auto lg:pb-1">
      {urls.map((url, i) => {
        const order = selectedIndices.indexOf(i)
        const isSelected = order !== -1
        const overlay = frame?.overlays?.[i]
        return (
          <button
            key={i}
            type="button"
            onClick={() => onToggle(i)}
            className={`relative aspect-4/3 overflow-hidden rounded-md border-2 transition lg:h-full lg:w-auto ${
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
                crossOrigin="anonymous"
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
            {isSelected && <div className="absolute inset-0 bg-black/20" />}
            {isSelected && (
              <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
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
    <div className="-mx-2 flex shrink-0 gap-2 overflow-x-auto px-2 py-1">
      {filters.map((f) => {
        const isSelected = f.id === selectedId
        return (
          <button
            key={f.id}
            type="button"
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
