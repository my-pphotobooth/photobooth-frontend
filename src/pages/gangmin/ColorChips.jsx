import { useEffect, useState } from 'react'
import {
  createColorChip,
  deleteColorChip,
  fetchAdminColorChips,
  updateColorChip,
} from '../../api/gangmin'
import { nextSortOrder } from './sortOrder'
import { EmptyState, ErrorBanner, Spinner } from './ui'
import { useConfirm, useToast } from './uiHooks'

const NEW_CHIP = {
  name: '',
  backgroundColor: '#ffffff',
  slotColor: '#e5e7eb',
  textColor: '#1f2937',
  sortOrder: 0,
}

export default function ColorChips() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const toast = useToast()

  function reload() {
    fetchAdminColorChips()
      .then((rows) => {
        setItems(rows)
        setStatus('ready')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }

  useEffect(() => {
    reload()
  }, [])

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-900">컬러칩</h1>
      </header>

      <p className="text-xs text-neutral-500">
        편집 화면에서 기본 프레임 색을 고를 때 쓰는 색 세트예요.
      </p>

      <ChipForm
        key={`new-${nextSortOrder(items)}`}
        initial={{ ...NEW_CHIP, sortOrder: nextSortOrder(items) }}
        submitLabel="추가"
        onSubmit={async (data) => {
          await createColorChip(data)
          toast.success('컬러칩을 추가했어요')
          reload()
        }}
        onError={setError}
      />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {status === 'loading' && <Spinner />}
      {status === 'ready' && items.length === 0 && (
        <EmptyState icon="🎨" title="아직 컬러칩이 없어요" />
      )}

      {status === 'ready' && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <ChipRow key={item.id} item={item} onChanged={reload} onError={setError} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ChipRow({ item, onChanged, onError }) {
  const [editing, setEditing] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

  async function remove() {
    const ok = await confirm({
      title: '컬러칩 삭제',
      message: `"${item.name}" 칩을 삭제할까요?`,
      confirmLabel: '삭제',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteColorChip(item.id)
      toast.success('삭제했어요')
      onChanged()
    } catch (err) {
      onError(err.message)
    }
  }

  if (editing) {
    return (
      <li>
        <ChipForm
          initial={item}
          submitLabel="저장"
          onCancel={() => setEditing(false)}
          onSubmit={async (data) => {
            await updateColorChip(item.id, data)
            toast.success('수정했어요')
            setEditing(false)
            onChanged()
          }}
          onError={onError}
        />
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
      <ChipPreview chip={item} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">
          {item.name}
        </p>
        <p className="font-mono text-[10px] text-neutral-500">
          {item.backgroundColor} · {item.slotColor} · {item.textColor}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          수정
        </button>
        <button
          onClick={remove}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700"
        >
          삭제
        </button>
      </div>
    </li>
  )
}

function ChipPreview({ chip }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 flex-col justify-center gap-0.5 rounded-md border border-neutral-300 p-1"
      style={{ backgroundColor: chip.backgroundColor }}
    >
      <span
        className="h-2 w-full rounded-sm"
        style={{ backgroundColor: chip.slotColor }}
      />
      <span
        className="mx-auto h-1 w-2/3 rounded-sm"
        style={{ backgroundColor: chip.textColor }}
      />
    </div>
  )
}

function ChipForm({ initial, submitLabel, onSubmit, onCancel, onError }) {
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setBusy(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        backgroundColor: form.backgroundColor,
        slotColor: form.slotColor,
        textColor: form.textColor,
        sortOrder: Number(form.sortOrder) || 0,
      })
      if (!onCancel) setForm(initial) // 새 칩 폼이면 초기화
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3"
    >
      <div className="flex items-center gap-3">
        <ChipPreview chip={form} />
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="칩 이름"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={form.sortOrder}
          onChange={(e) => set('sortOrder', e.target.value)}
          placeholder="정렬"
          className="w-20 rounded-md border border-neutral-300 px-2 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ColorField label="배경" value={form.backgroundColor} onChange={(v) => set('backgroundColor', v)} />
        <ColorField label="슬롯" value={form.slotColor} onChange={(v) => set('slotColor', v)} />
        <ColorField label="글자" value={form.textColor} onChange={(v) => set('textColor', v)} />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !form.name.trim()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
          >
            취소
          </button>
        )}
      </div>
    </form>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] text-neutral-500">{label}</span>
      <div className="flex gap-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-neutral-300"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 rounded-md border border-neutral-300 px-2 py-2 font-mono text-xs"
        />
      </div>
    </label>
  )
}
