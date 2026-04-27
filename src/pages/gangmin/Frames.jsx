import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteFrame,
  fetchAdminCategories,
  fetchAdminFrames,
} from '../../api/gangmin'

export default function Frames() {
  const [frames, setFrames] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  async function reload() {
    try {
      const [frs, cats] = await Promise.all([
        fetchAdminFrames(),
        fetchAdminCategories(),
      ])
      setFrames(frs)
      setCategories(cats)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleDelete(frame) {
    if (!window.confirm(`"${frame.name}" 프레임을 삭제할까요?`)) return
    try {
      await deleteFrame(frame.id)
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-900">프레임</h1>
        <Link
          to="/gangmin/frames/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + 새 프레임
        </Link>
      </header>

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {status === 'loading' && (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      )}

      {status === 'ready' && categories.length === 0 && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          먼저{' '}
          <Link to="/gangmin/categories" className="underline">
            카테고리
          </Link>
          를 만들어주세요
        </p>
      )}

      {status === 'ready' &&
        categories.map((cat) => {
          const list = frames.filter((f) => f.categoryId === cat.id)
          return (
            <div
              key={cat.id}
              className="rounded-xl border border-neutral-200 bg-white"
            >
              <div className="border-b border-neutral-200 px-4 py-2 text-xs font-medium uppercase tracking-wider text-neutral-600">
                {cat.name} ({list.length})
              </div>
              {list.length === 0 ? (
                <p className="p-4 text-sm text-neutral-500">
                  이 카테고리에 프레임이 없어요
                </p>
              ) : (
                <ul className="divide-y divide-neutral-200">
                  {list.map((f) => (
                    <FrameRow
                      key={f.id}
                      frame={f}
                      onDelete={() => handleDelete(f)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )
        })}
    </section>
  )
}

function FrameRow({ frame, onDelete }) {
  const overlayCount = Array.isArray(frame.overlays)
    ? frame.overlays.length
    : 0
  const status = computeStatus(frame)
  return (
    <li className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">
          {frame.name}
        </p>
        <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-neutral-500">
          <span>정렬 {frame.sortOrder}</span>
          {overlayCount > 0 && <span>오버레이 {overlayCount}</span>}
          <span className={status.tone}>{status.label}</span>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link
          to={`/gangmin/frames/${frame.id}/edit`}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          수정
        </Link>
        <button
          onClick={onDelete}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700"
        >
          삭제
        </button>
      </div>
    </li>
  )
}

function computeStatus(frame) {
  const now = Date.now()
  const from = frame.availableFrom ? Date.parse(frame.availableFrom) : null
  const until = frame.availableUntil ? Date.parse(frame.availableUntil) : null
  if (from && now < from) return { label: '예정', tone: 'text-amber-600' }
  if (until && now > until) return { label: '만료', tone: 'text-neutral-400' }
  return { label: '활성', tone: 'text-emerald-600' }
}

function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 text-red-500 hover:text-red-900"
      >
        ×
      </button>
    </div>
  )
}
