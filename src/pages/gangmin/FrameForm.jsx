import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createFrame,
  fetchAdminCategories,
  fetchAdminFrame,
  updateFrame,
} from '../../api/gangmin'

const EMPTY = {
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

export default function FrameForm({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [overlays, setOverlays] = useState(null)
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
          setOverlays(frame.overlays)
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

        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          오버레이는 다음 단계(Phase 3)에서 편집 가능합니다.
          {mode === 'edit' &&
            ` 현재 ${Array.isArray(overlays) ? overlays.length : 0}개 등록됨.`}
        </p>
      </div>

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
