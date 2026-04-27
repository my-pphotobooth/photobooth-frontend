import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createFrame,
  fetchAdminCategories,
  fetchAdminFrame,
  updateFrame,
  uploadAdminFile,
} from '../../api/gangmin'

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  slotColor: '#e5e7eb',
  footerText: 'my-photobooth',
  availableFrom: '',
  availableUntil: '',
  sortOrder: 0,
}

const NEW_OVERLAY = { src: '', right: 0, bottom: 0, height: 0.8 }

export default function FrameForm({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [overlays, setOverlays] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState(mode === 'edit' ? 'loading' : 'ready')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cats = await fetchAdminCategories()
        if (cancelled) return
        setCategories(cats)
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
          setOverlays(Array.isArray(frame.overlays) ? frame.overlays : [])
          setStatus('ready')
        } else if (cats[0]) {
          setForm((f) => ({ ...f, categoryId: cats[0].id }))
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

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
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
        overlays: overlays.length > 0 ? overlays : null,
      }
      if (mode === 'create') {
        await createFrame(payload)
      } else {
        await updateFrame(id, payload)
      }
      navigate('/gangmin/frames')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return <p className="text-sm text-neutral-500">불러오는 중…</p>
  }
  if (status === 'error') {
    return <p className="text-sm text-red-600">{error}</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            onChange={(e) => update('categoryId', e.target.value)}
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

      <OverlayEditor overlays={overlays} onChange={setOverlays} />

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
  )
}

function OverlayEditor({ overlays, onChange }) {
  function setEntry(i, partial) {
    onChange(
      overlays.map((o, idx) => (idx === i ? { ...o, ...partial } : o)),
    )
  }
  function addEntry() {
    onChange([...overlays, { ...NEW_OVERLAY }])
  }
  function removeEntry(i) {
    onChange(overlays.filter((_, idx) => idx !== i))
  }
  function moveEntry(i, dir) {
    const j = i + dir
    if (j < 0 || j >= overlays.length) return
    const next = [...overlays]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-900">오버레이</h2>
        <span className="text-xs text-neutral-500">샷 인덱스 순서</span>
      </header>

      <p className="text-xs text-neutral-500">
        샷별로 슬롯 우하단에 합성되는 이미지입니다. 보통 8개 정도 (촬영 횟수 만큼) 추가합니다.
      </p>

      {overlays.length === 0 && (
        <p className="rounded-md bg-neutral-50 px-3 py-4 text-center text-xs text-neutral-500">
          오버레이가 없는 일반 프레임입니다. 필요하면 아래에서 추가하세요.
        </p>
      )}

      <div className="space-y-2">
        {overlays.map((o, i) => (
          <OverlayRow
            key={i}
            index={i}
            overlay={o}
            isFirst={i === 0}
            isLast={i === overlays.length - 1}
            onChange={(p) => setEntry(i, p)}
            onRemove={() => removeEntry(i)}
            onMoveUp={() => moveEntry(i, -1)}
            onMoveDown={() => moveEntry(i, 1)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="w-full rounded-md border border-dashed border-neutral-400 px-3 py-2 text-sm text-neutral-600 hover:border-neutral-600"
      >
        + 오버레이 추가
      </button>
    </section>
  )
}

function OverlayRow({
  index,
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
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-700">
          샷 {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="rounded px-1.5 text-xs text-neutral-500 disabled:opacity-30"
            title="위로"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="rounded px-1.5 text-xs text-neutral-500 disabled:opacity-30"
            title="아래로"
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

        <div className="flex-1 space-y-1.5">
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileChange}
            disabled={busy}
            className="block w-full text-xs"
          />
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <Slider
            label="오른쪽"
            value={overlay.right}
            onChange={(v) => onChange({ right: v })}
          />
          <Slider
            label="아래쪽"
            value={overlay.bottom}
            onChange={(v) => onChange({ bottom: v })}
          />
          <Slider
            label="높이"
            value={overlay.height}
            onChange={(v) => onChange({ height: v })}
          />
        </div>
      </div>
    </div>
  )
}

function Slider({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-xs text-neutral-600">{label}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <span className="w-10 shrink-0 text-right font-mono text-[10px] text-neutral-500">
        {Number(value).toFixed(2)}
      </span>
    </label>
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
