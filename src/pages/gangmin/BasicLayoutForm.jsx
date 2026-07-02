import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createBasicLayout,
  fetchAdminBasicLayout,
  fetchAdminBasicLayouts,
  updateBasicLayout,
} from '../../api/gangmin'
import { DEFAULT_LAYOUT } from '../../data/frames'
import { nextSortOrder } from './sortOrder'
import SlotEditor from './SlotEditor'
import { Spinner } from './ui'
import { useToast } from './uiHooks'

function freshLayout() {
  return structuredClone(DEFAULT_LAYOUT)
}

export default function BasicLayoutForm({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [footerText, setFooterText] = useState('my-photobooth')
  const [sortOrder, setSortOrder] = useState(0)
  const [layout, setLayout] = useState(freshLayout)
  const [status, setStatus] = useState(mode === 'edit' ? 'loading' : 'ready')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    if (mode === 'edit') {
      fetchAdminBasicLayout(id)
        .then((row) => {
          if (cancelled) return
          setName(row.name)
          setFooterText(row.footerText)
          setSortOrder(row.sortOrder)
          setLayout(row.layout ?? freshLayout())
          setStatus('ready')
        })
        .catch((err) => {
          if (cancelled) return
          setError(err.message)
          setStatus('error')
        })
    } else {
      // 새 규격: 마지막 정렬 순서 + 1을 기본값으로
      fetchAdminBasicLayouts()
        .then((rows) => {
          if (!cancelled) setSortOrder(nextSortOrder(rows))
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [mode, id])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        footerText,
        sortOrder: Number(sortOrder) || 0,
        layout,
      }
      if (mode === 'create') {
        await createBasicLayout(payload)
        toast.success('규격을 추가했어요')
      } else {
        await updateBasicLayout(id, payload)
        toast.success('규격을 수정했어요')
      }
      navigate('/gangmin/basic-layouts')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') return <Spinner />
  if (status === 'error') return <p className="text-sm text-red-600">{error}</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-900">
          {mode === 'create' ? '새 규격' : '규격 수정'}
        </h1>
      </header>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-700">
            이름
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-700">
              푸터 텍스트
            </span>
            <input
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-700">
              정렬 순서
            </span>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      <SlotEditor
        layout={layout}
        frameImageUrl={null}
        backgroundColor="#ffffff"
        slotColor="#c8ccd2"
        onChange={setLayout}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/gangmin/basic-layouts')}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
        >
          취소
        </button>
      </div>
    </form>
  )
}
