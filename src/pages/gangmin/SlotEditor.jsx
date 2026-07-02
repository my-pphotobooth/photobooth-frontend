import { useRef, useState } from 'react'

const MIN_SLOT = 20 // 캔버스 픽셀 기준 최소 슬롯 크기

// 업로드한 프레임 이미지(또는 색상 캔버스) 위에서 슬롯을 드래그/리사이즈로 배치한다.
// 좌표는 캔버스 픽셀 기준으로 저장하고, 화면은 축소 배율로 표시한다.
export default function SlotEditor({
  layout,
  frameImageUrl,
  backgroundColor,
  slotColor,
  onChange,
}) {
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const [selected, setSelected] = useState(null)

  const { canvas, slots } = layout
  const pct = (v, total) => `${(v / total) * 100}%`

  function commit(nextSlots, extra) {
    const shotCount = Math.max(layout.shotCount ?? 0, nextSlots.length)
    onChange({ ...layout, ...extra, shotCount, slots: nextSlots })
  }

  function updateSlot(i, patch) {
    commit(slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  function addSlot() {
    const w = Math.round(canvas.width * 0.8)
    const h = Math.round((w * 3) / 4)
    const x = Math.round((canvas.width - w) / 2)
    const y = clamp(
      Math.round(canvas.height * 0.08) + slots.length * 24,
      0,
      canvas.height - h,
    )
    commit([...slots, { x, y, width: w, height: h, shape: 'rect', radius: 0 }])
    setSelected(slots.length)
  }

  function removeSlot(i) {
    commit(slots.filter((_, idx) => idx !== i))
    setSelected(null)
  }

  // 포인터 드래그 (이동/리사이즈) — 터치·마우스 공통
  function startDrag(e, i, mode) {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = stageRef.current.getBoundingClientRect()
    dragRef.current = {
      i,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...slots[i] },
      scaleX: canvas.width / rect.width,
      scaleY: canvas.height / rect.height,
    }
    setSelected(i)
  }

  function onDragMove(e) {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.startX) * d.scaleX
    const dy = (e.clientY - d.startY) * d.scaleY
    if (d.mode === 'move') {
      updateSlot(d.i, {
        x: clamp(Math.round(d.orig.x + dx), 0, canvas.width - d.orig.width),
        y: clamp(Math.round(d.orig.y + dy), 0, canvas.height - d.orig.height),
      })
    } else {
      updateSlot(d.i, {
        width: clamp(
          Math.round(d.orig.width + dx),
          MIN_SLOT,
          canvas.width - d.orig.x,
        ),
        height: clamp(
          Math.round(d.orig.height + dy),
          MIN_SLOT,
          canvas.height - d.orig.y,
        ),
      })
    }
  }

  function endDrag(e) {
    if (dragRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // capture가 이미 해제된 경우 무시
      }
    }
    dragRef.current = null
  }

  const sel = selected != null ? slots[selected] : null

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-900">슬롯 배치</h2>
        <span className="text-xs text-neutral-500">
          {slots.length}칸 · {canvas.width}×{canvas.height}
        </span>
      </header>

      <p className="text-xs text-neutral-500">
        칸을 드래그해 옮기고, 우하단 손잡이로 크기를 조절하세요. 사진은 이 칸
        위치에 들어갑니다.
      </p>

      <div className="flex justify-center">
        <div
          ref={stageRef}
          className="relative w-40 touch-none overflow-hidden rounded-md border border-neutral-300 select-none sm:w-52"
          style={{
            aspectRatio: `${canvas.width} / ${canvas.height}`,
            backgroundColor,
          }}
          onPointerDown={() => setSelected(null)}
        >
          {frameImageUrl && (
            <img
              src={frameImageUrl}
              alt=""
              draggable="false"
              className="pointer-events-none absolute inset-0 h-full w-full object-fill"
            />
          )}

          {slots.map((s, i) => {
            const isSel = i === selected
            return (
              <div
                key={i}
                onPointerDown={(e) => startDrag(e, i, 'move')}
                onPointerMove={onDragMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`absolute cursor-move ${
                  isSel ? 'ring-2 ring-blue-500' : 'ring-1 ring-neutral-400'
                }`}
                style={{
                  left: pct(s.x, canvas.width),
                  top: pct(s.y, canvas.height),
                  width: pct(s.width, canvas.width),
                  height: pct(s.height, canvas.height),
                  borderRadius: `${((s.radius || 0) / s.width) * 100}%`,
                  backgroundColor: hexToRgba(slotColor, 0.65),
                }}
              >
                <span className="absolute left-0.5 top-0.5 rounded bg-black/50 px-1 text-[9px] font-bold text-white">
                  {i + 1}
                </span>
                {isSel && (
                  <span
                    onPointerDown={(e) => startDrag(e, i, 'resize')}
                    onPointerMove={onDragMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    className="absolute -right-1.5 -bottom-1.5 h-4 w-4 cursor-se-resize rounded-full border-2 border-white bg-blue-500 shadow"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addSlot}
          className="rounded-md border border-dashed border-neutral-400 px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-600"
        >
          + 슬롯 추가
        </button>
        <label className="flex items-center gap-1.5 text-xs text-neutral-600">
          촬영 횟수
          <input
            type="number"
            min={slots.length}
            max={30}
            value={layout.shotCount ?? slots.length}
            onChange={(e) =>
              onChange({
                ...layout,
                shotCount: clamp(
                  Number(e.target.value) || slots.length,
                  slots.length,
                  30,
                ),
              })
            }
            className="w-16 rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <span className="text-neutral-400">/ 슬롯 {slots.length}</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <NumField
          label="캔버스 폭"
          value={canvas.width}
          min={100}
          onChange={(v) =>
            onChange({ ...layout, canvas: { ...canvas, width: v } })
          }
        />
        <NumField
          label="캔버스 높이"
          value={canvas.height}
          min={100}
          onChange={(v) =>
            onChange({ ...layout, canvas: { ...canvas, height: v } })
          }
        />
      </div>

      {sel ? (
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">
              슬롯 {selected + 1} 세부
            </span>
            <button
              type="button"
              onClick={() => removeSlot(selected)}
              className="rounded px-2 text-xs text-red-600 hover:bg-red-50"
            >
              삭제
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <NumField
              label="X"
              value={sel.x}
              min={0}
              max={canvas.width - sel.width}
              onChange={(v) => updateSlot(selected, { x: v })}
            />
            <NumField
              label="Y"
              value={sel.y}
              min={0}
              max={canvas.height - sel.height}
              onChange={(v) => updateSlot(selected, { y: v })}
            />
            <NumField
              label="폭"
              value={sel.width}
              min={MIN_SLOT}
              max={canvas.width - sel.x}
              onChange={(v) => updateSlot(selected, { width: v })}
            />
            <NumField
              label="높이"
              value={sel.height}
              min={MIN_SLOT}
              max={canvas.height - sel.y}
              onChange={(v) => updateSlot(selected, { height: v })}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="w-16 shrink-0">둥근모서리</span>
            <input
              type="range"
              min={0}
              max={Math.floor(Math.min(sel.width, sel.height) / 2)}
              value={sel.radius || 0}
              onChange={(e) =>
                updateSlot(selected, { radius: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="w-8 text-right font-mono text-[10px]">
              {sel.radius || 0}
            </span>
          </label>
        </div>
      ) : (
        <p className="rounded-md bg-neutral-50 px-3 py-3 text-center text-xs text-neutral-500">
          칸을 선택하면 세부 조정(위치·크기·둥근모서리·삭제)이 나타납니다.
        </p>
      )}
    </section>
  )
}

function NumField({ label, value, onChange, min, max }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] text-neutral-500">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          let v = Math.round(Number(e.target.value))
          if (!Number.isFinite(v)) return
          if (min != null) v = Math.max(min, v)
          if (max != null) v = Math.min(max, v)
          onChange(v)
        }}
        className="w-full rounded border border-neutral-300 px-2 py-1 text-xs"
      />
    </label>
  )
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max)
}

function hexToRgba(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!m) return hex || 'rgba(0,0,0,0.4)'
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
