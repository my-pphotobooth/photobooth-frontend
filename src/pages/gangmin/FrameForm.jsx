import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createFrame,
  fetchAdminBasicLayouts,
  fetchAdminCategories,
  fetchAdminFrame,
  fetchAdminFrames,
  updateFrame,
  uploadAdminFile,
} from '../../api/gangmin'
import { composeFrame } from '../../utils/compose'
import {
  DEFAULT_LAYOUT,
  OVERLAY_DEFAULTS,
  getCanvasOverlays,
  getShotCount,
  getShotOverlays,
  normalizeOverlays,
} from '../../data/frames'
import { nextSortOrder } from './sortOrder'
import SlotEditor from './SlotEditor'
import { Spinner } from './ui'
import { useToast } from './uiHooks'

function freshLayout() {
  return structuredClone(DEFAULT_LAYOUT)
}

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  slotColor: '#e5e7eb',
  footerText: "gang's-photo",
  availableFrom: '',
  availableUntil: '',
  sortOrder: 0,
}

// 편집 중 state는 anchor/shotIndex/clip을 항상 명시적으로 들고 있는다.
// (구버전 데이터는 불러올 때 normalizeOverlays가 채워준다)
function newOverlay(shotIndex) {
  const isCanvas = shotIndex === null
  return {
    ...OVERLAY_DEFAULTS,
    anchor: isCanvas ? 'canvas' : 'slot',
    shotIndex: isCanvas ? null : shotIndex,
    clip: !isCanvas,
  }
}

export default function FrameForm({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [overlays, setOverlays] = useState([])
  const [layout, setLayout] = useState(freshLayout)
  const [frameImageUrl, setFrameImageUrl] = useState(null)
  const [categories, setCategories] = useState([])
  const [basicLayouts, setBasicLayouts] = useState([])
  const [frames, setFrames] = useState([])
  const [status, setStatus] = useState(mode === 'edit' ? 'loading' : 'ready')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cats, bls, frs] = await Promise.all([
          fetchAdminCategories(),
          fetchAdminBasicLayouts(),
          mode === 'create' ? fetchAdminFrames() : Promise.resolve([]),
        ])
        if (cancelled) return
        setCategories(cats)
        setBasicLayouts(bls)
        if (mode === 'edit') {
          const frame = await fetchAdminFrame(id)
          if (cancelled) return
          setForm({
            name: frame.name,
            categoryId: frame.categoryId,
            backgroundColor: frame.backgroundColor,
            textColor: frame.textColor,
            slotColor: frame.slotColor,
            footerText: frame.footerText,
            availableFrom: toLocalInput(frame.availableFrom),
            availableUntil: toLocalInput(frame.availableUntil),
            sortOrder: frame.sortOrder,
          })
          setOverlays(normalizeOverlays(frame.overlays))
          setLayout(frame.layout ?? freshLayout())
          setFrameImageUrl(frame.frameImageUrl ?? null)
          setStatus('ready')
        } else {
          setFrames(frs)
          const catId = cats[0]?.id ?? ''
          setForm((f) => ({
            ...f,
            categoryId: catId,
            sortOrder: nextSortOrder(
              frs.filter((fr) => fr.categoryId === catId),
            ),
          }))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setStatus('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mode, id])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // 카테고리를 바꾸면(새 프레임일 때) 그 카테고리의 마지막 정렬 순서 + 1로 갱신
  function handleCategoryChange(categoryId) {
    setForm((f) => {
      const next = { ...f, categoryId }
      if (mode === 'create') {
        next.sortOrder = nextSortOrder(
          frames.filter((fr) => fr.categoryId === categoryId),
        )
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const savedOverlays = overlays.filter((o) => o.src)
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        backgroundColor: form.backgroundColor,
        textColor: form.textColor,
        slotColor: form.slotColor,
        footerText: form.footerText,
        availableFrom: form.availableFrom
          ? new Date(form.availableFrom).toISOString()
          : null,
        availableUntil: form.availableUntil
          ? new Date(form.availableUntil).toISOString()
          : null,
        sortOrder: Number(form.sortOrder) || 0,
        // 이미지를 아직 안 올린 빈 줄은 저장하지 않는다
        overlays: savedOverlays.length > 0 ? savedOverlays : null,
        layout,
        frameImageUrl: frameImageUrl || null,
      }
      if (mode === 'create') {
        await createFrame(payload)
        toast.success('프레임을 추가했어요')
      } else {
        await updateFrame(id, payload)
        toast.success('프레임을 수정했어요')
      }
      navigate('/gangmin/frames')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return <Spinner />
  }
  if (status === 'error') {
    return <p className="text-sm text-red-600">{error}</p>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_240px] lg:gap-8">
      <aside className="lg:order-2 lg:sticky lg:top-6 lg:self-start">
        <LivePreview
          form={form}
          overlays={overlays}
          layout={layout}
          frameImageUrl={frameImageUrl}
        />
      </aside>

      <form onSubmit={handleSubmit} className="space-y-4 lg:order-1 lg:min-w-0">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-neutral-900">
            {mode === 'create' ? '새 프레임' : '프레임 수정'}
          </h1>
        </header>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
          <Field label="이름">
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="카테고리">
            <select
              value={form.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                선택…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="배경색">
              <ColorInput
                value={form.backgroundColor}
                onChange={(v) => update('backgroundColor', v)}
              />
            </Field>
            <Field label="슬롯색">
              <ColorInput
                value={form.slotColor}
                onChange={(v) => update('slotColor', v)}
              />
            </Field>
            <Field label="글자색">
              <ColorInput
                value={form.textColor}
                onChange={(v) => update('textColor', v)}
              />
            </Field>
          </div>

          <Field label="푸터 텍스트">
            <input
              value={form.footerText}
              onChange={(e) => update('footerText', e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="노출 시작 (선택)">
              <input
                type="datetime-local"
                value={form.availableFrom}
                onChange={(e) => update('availableFrom', e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="노출 종료 (선택)">
              <input
                type="datetime-local"
                value={form.availableUntil}
                onChange={(e) => update('availableUntil', e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="정렬 순서">
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => update('sortOrder', e.target.value)}
              className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <FrameImageField
          frameImageUrl={frameImageUrl}
          onChange={setFrameImageUrl}
          onImageSize={(w, h) =>
            setLayout((l) => ({ ...l, canvas: { width: w, height: h } }))
          }
        />

        {basicLayouts.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-700">
                기본 규격에서 불러오기
              </span>
              <select
                defaultValue=""
                onChange={(e) => {
                  const bl = basicLayouts.find((b) => b.id === e.target.value)
                  if (bl) setLayout(structuredClone(bl.layout))
                  e.target.value = ''
                }}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">규격 선택…</option>
                {basicLayouts.map((bl) => (
                  <option key={bl.id} value={bl.id}>
                    {bl.name} ({bl.layout.canvas.width}×{bl.layout.canvas.height},{' '}
                    {bl.layout.slots.length}칸)
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-1 text-xs text-neutral-500">
              선택하면 아래 캔버스 크기·슬롯 배치·촬영 횟수가 그 규격으로
              채워져요. (색·이미지·오버레이는 유지)
            </p>
          </div>
        )}

        <SlotEditor
          layout={layout}
          frameImageUrl={frameImageUrl}
          backgroundColor={form.backgroundColor}
          slotColor={form.slotColor}
          onChange={setLayout}
        />

        <OverlayEditor
          overlays={overlays}
          shotCount={getShotCount({ layout })}
          onChange={setOverlays}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || !form.categoryId}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/gangmin/frames')}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}

function LivePreview({ form, overlays, layout, frameImageUrl }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const lastUrlRef = useRef(null)
  const aspectRatio = `${layout.canvas.width} / ${layout.canvas.height}`

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      if (!cancelled) setPending(true)
      try {
        const photoBlobs = makeDummyPhotoBlobs(form.slotColor, layout.slots.length)
        const blob = await composeFrame({
          frame: {
            backgroundColor: form.backgroundColor,
            textColor: form.textColor,
            footerText: form.footerText,
            layout,
            frameImageUrl,
          },
          photoBlobs,
          // 미리보기는 샷 i를 슬롯 i에 그대로 넣어 본다
          overlays: layout.slots.map((_, i) => getShotOverlays({ overlays }, i)),
          canvasOverlays: getCanvasOverlays({ overlays }),
          filterCss: 'none',
        })
        if (cancelled) return
        const newUrl = URL.createObjectURL(blob)
        if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
        lastUrlRef.current = newUrl
        setUrl(newUrl)
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err?.message || '미리보기 실패')
      } finally {
        if (!cancelled) setPending(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [form, overlays, layout, frameImageUrl])

  useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
    }
  }, [])

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-medium text-neutral-700">미리보기</h2>
        {pending && (
          <span className="text-[10px] text-neutral-400">렌더링 중…</span>
        )}
      </div>
      <div className="flex justify-center">
        {url ? (
          <img
            src={url}
            alt=""
            style={{ aspectRatio }}
            className="w-32 rounded-md bg-neutral-100 object-contain shadow-md sm:w-40 lg:w-full lg:max-w-50"
          />
        ) : (
          <div
            style={{ aspectRatio }}
            className="w-32 animate-pulse rounded-md bg-neutral-100 sm:w-40 lg:w-full lg:max-w-50"
          />
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600 wrap-break-word">{error}</p>
      )}
      <p className="mt-2 text-[10px] text-neutral-400">
        슬롯색으로 채운 더미 사진으로 합성한 결과예요.
      </p>
    </section>
  )
}

function makeDummyPhotoBlobs(slotColor, count = 4) {
  return Array.from({ length: count }, (_, i) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${slotColor}"/><text x="400" y="380" text-anchor="middle" font-size="280" font-weight="bold" fill="rgba(0,0,0,0.12)" font-family="system-ui">${i + 1}</text></svg>`
    return new Blob([svg], { type: 'image/svg+xml' })
  })
}

function FrameImageField({ frameImageUrl, onChange, onImageSize }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const { url } = await uploadAdminFile(file)
      const size = await readImageSize(url)
      onChange(url)
      if (size) onImageSize(size.width, size.height)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-900">프레임 이미지</h2>
        {frameImageUrl && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded px-2 text-xs text-red-600 hover:bg-red-50"
          >
            제거
          </button>
        )}
      </header>
      <p className="text-xs text-neutral-500">
        브랜딩이 포함된 프레임 이미지를 올리면 슬롯 위치에 자동으로 구멍을 뚫어
        사진을 합성합니다. (이미지 프레임은 푸터 텍스트 생략) 업로드 시 캔버스
        규격이 이미지 크기로 맞춰집니다.
      </p>
      <div className="flex items-center gap-3">
        <div className="h-24 w-16 shrink-0 overflow-hidden rounded-md border border-neutral-300 bg-neutral-50">
          {frameImageUrl ? (
            <img
              src={frameImageUrl}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-[10px] text-neutral-400">
              이미지
              <br />
              없음
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFile}
            disabled={busy}
            className="block w-full text-xs"
          />
          {busy && <p className="text-xs text-neutral-500">업로드 중…</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </section>
  )
}

function readImageSize(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function OverlayEditor({ overlays, shotCount, onChange }) {
  function setEntry(i, partial) {
    onChange(overlays.map((o, idx) => (idx === i ? { ...o, ...partial } : o)))
  }
  function removeEntry(i) {
    onChange(overlays.filter((_, idx) => idx !== i))
  }
  // 배열 순서가 곧 겹쳐 그리는 순서. 같은 그룹 안에서만 자리를 바꾼다.
  function swapEntries(i, j) {
    const next = [...overlays]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  function addEntry(shotIndex) {
    onChange([...overlays, newOverlay(shotIndex)])
  }

  const indexed = overlays.map((overlay, i) => ({ overlay, i }))
  const groups = Array.from({ length: shotCount }, (_, s) => ({
    key: `shot-${s}`,
    title: `샷 ${s + 1}`,
    shotIndex: s,
    entries: indexed.filter(
      ({ overlay }) => overlay.anchor !== 'canvas' && overlay.shotIndex === s,
    ),
  }))
  const canvasEntries = indexed.filter(
    ({ overlay }) => overlay.anchor === 'canvas',
  )
  // 촬영 횟수를 줄이면 갈 곳 없는 오버레이가 생긴다. 지울 수 있게 따로 보여준다.
  const orphanEntries = indexed.filter(
    ({ overlay }) =>
      overlay.anchor !== 'canvas' &&
      !(overlay.shotIndex >= 0 && overlay.shotIndex < shotCount),
  )

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-900">오버레이</h2>
        <span className="text-xs text-neutral-500">
          {overlays.length}개 · 샷 {shotCount}컷
        </span>
      </header>

      <p className="text-xs text-neutral-500">
        샷마다 이미지를 여러 장 얹을 수 있어요. 기본은 슬롯 안에서 잘리고,
        <b className="font-medium text-neutral-700"> 슬롯 밖으로 표시</b>를 켜면
        사진 영역을 넘어 프레임 여백까지 삐져나옵니다.
      </p>

      {groups.map((g) => (
        <OverlayGroup
          key={g.key}
          title={g.title}
          entries={g.entries}
          onAdd={() => addEntry(g.shotIndex)}
          onChange={setEntry}
          onRemove={removeEntry}
          onSwap={swapEntries}
        />
      ))}

      <OverlayGroup
        title="프레임 전체"
        hint="슬롯과 무관하게 프레임(캔버스) 기준으로 배치돼요. 모서리 리본·로고처럼 사진과 상관없는 장식용."
        entries={canvasEntries}
        onAdd={() => addEntry(null)}
        onChange={setEntry}
        onRemove={removeEntry}
        onSwap={swapEntries}
      />

      {orphanEntries.length > 0 && (
        <OverlayGroup
          title="촬영 횟수 밖"
          hint="지금 촬영 횟수보다 뒤에 있는 샷에 붙어 있어 합성되지 않아요."
          entries={orphanEntries}
          onChange={setEntry}
          onRemove={removeEntry}
          onSwap={swapEntries}
        />
      )}
    </section>
  )
}

function OverlayGroup({
  title,
  hint,
  entries,
  onAdd,
  onChange,
  onRemove,
  onSwap,
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold text-neutral-700">{title}</span>
        {entries.length > 0 && (
          <span className="text-[10px] text-neutral-500">
            {entries.length}장 · 아래가 위로
          </span>
        )}
      </div>
      {hint && <p className="mb-2 text-[11px] text-neutral-500">{hint}</p>}

      <div className="space-y-2">
        {entries.map(({ overlay, i }, pos) => (
          <OverlayRow
            key={i}
            label={`이미지 ${pos + 1}`}
            overlay={overlay}
            isFirst={pos === 0}
            isLast={pos === entries.length - 1}
            onChange={(p) => onChange(i, p)}
            onRemove={() => onRemove(i)}
            onMoveUp={() => onSwap(i, entries[pos - 1].i)}
            onMoveDown={() => onSwap(i, entries[pos + 1].i)}
          />
        ))}
      </div>

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className={`w-full rounded-md border border-dashed border-neutral-400 px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-600 ${
            entries.length > 0 ? 'mt-2' : ''
          }`}
        >
          + 이미지 추가
        </button>
      )}
    </div>
  )
}

function OverlayRow({
  label,
  overlay,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const isCanvas = overlay.anchor === 'canvas'

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const { url } = await uploadAdminFile(file)
      onChange({ src: url })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-700">{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="rounded px-1.5 text-xs text-neutral-500 disabled:opacity-30"
            title="뒤로 (아래에 깔기)"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="rounded px-1.5 text-xs text-neutral-500 disabled:opacity-30"
            title="앞으로 (위에 올리기)"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded px-2 text-xs text-red-600 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-neutral-300 bg-white">
          {overlay.src ? (
            <img
              crossOrigin="anonymous"
              src={overlay.src}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">
              이미지 없음
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileChange}
            disabled={busy}
            className="block w-full text-xs"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}

          {!isCanvas && (
            <label className="flex items-center gap-1.5 text-xs text-neutral-700">
              <input
                type="checkbox"
                checked={!overlay.clip}
                onChange={(e) => onChange({ clip: !e.target.checked })}
              />
              슬롯 밖으로 표시
            </label>
          )}

          <Slider
            label="오른쪽"
            value={overlay.right}
            onChange={(v) => onChange({ right: v })}
            min={-1}
            max={2}
          />
          <Slider
            label="아래쪽"
            value={overlay.bottom}
            onChange={(v) => onChange({ bottom: v })}
            min={-1}
            max={2}
          />
          <Slider
            label="높이"
            value={overlay.height}
            onChange={(v) => onChange({ height: v })}
            min={0.1}
            max={3}
          />
        </div>
      </div>

      <p className="mt-1.5 text-[10px] text-neutral-400">
        {isCanvas
          ? '프레임 전체 크기 기준 비율'
          : '슬롯 크기 기준 비율 · 우하단에서의 거리'}
      </p>
    </div>
  )
}

// 슬라이더 범위를 벗어나는 값도 넣을 수 있게 숫자 입력을 함께 둔다.
function Slider({ label, value, onChange, min = 0, max = 1, step = 0.01 }) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-xs text-neutral-600">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1"
      />
      <NumberField value={value} step={step} onChange={onChange} />
    </label>
  )
}

function NumberField({ value, step, onChange }) {
  const [draft, setDraft] = useState(String(value))
  const [lastValue, setLastValue] = useState(value)

  // 슬라이더 등 바깥에서 값이 바뀌면 따라간다.
  // 입력 중인 "0." 같은 중간 상태는 숫자로 같으므로 건드리지 않는다.
  if (value !== lastValue) {
    setLastValue(value)
    if (Number(draft) !== value) setDraft(String(value))
  }

  return (
    <input
      type="number"
      step={step}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value)
        const v = Number(e.target.value)
        if (e.target.value !== '' && Number.isFinite(v)) onChange(v)
      }}
      onBlur={() => setDraft(String(value))}
      className="w-16 shrink-0 rounded border border-neutral-300 px-1 py-0.5 text-right font-mono text-[11px]"
    />
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-700">
        {label}
      </span>
      {children}
    </label>
  )
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded-md border border-neutral-300"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 rounded-md border border-neutral-300 px-2 py-2 font-mono text-xs"
      />
    </div>
  )
}

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
