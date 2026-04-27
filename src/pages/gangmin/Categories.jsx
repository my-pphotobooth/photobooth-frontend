import { useEffect, useMemo, useState } from 'react'
import {
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  fetchAdminFrames,
  updateCategory,
} from '../../api/gangmin'

export default function Categories() {
  const [items, setItems] = useState([])
  const [frames, setFrames] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  async function reload() {
    try {
      const [cats, frs] = await Promise.all([
        fetchAdminCategories(),
        fetchAdminFrames(),
      ])
      setItems(cats)
      setFrames(frs)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const frameCountByCategory = useMemo(() => {
    const map = new Map()
    for (const f of frames) {
      map.set(f.categoryId, (map.get(f.categoryId) ?? 0) + 1)
    }
    return map
  }, [frames])

  useEffect(() => {
    reload()
  }, [])

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-900">카테고리</h1>
      </header>

      <NewCategoryRow onCreated={reload} onError={setError} />

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {status === 'loading' && (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      )}

      {status === 'ready' && items.length === 0 && (
        <p className="text-sm text-neutral-500">아직 카테고리가 없어요</p>
      )}

      {status === 'ready' && items.length > 0 && (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {items.map((item) => (
            <CategoryRow
              key={item.id}
              item={item}
              frameCount={frameCountByCategory.get(item.id) ?? 0}
              onChanged={reload}
              onError={setError}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function NewCategoryRow({ onCreated, onError }) {
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await createCategory({
        name: name.trim(),
        sortOrder: Number(sortOrder) || 0,
      })
      setName('')
      setSortOrder(0)
      onCreated()
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 sm:flex-row"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="새 카테고리 이름"
        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        type="number"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        placeholder="정렬"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:w-24"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        추가
      </button>
    </form>
  )
}

function CategoryRow({ item, frameCount, onChanged, onError }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [sortOrder, setSortOrder] = useState(item.sortOrder)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.trim()) return
    setBusy(true)
    try {
      await updateCategory(item.id, {
        name: name.trim(),
        sortOrder: Number(sortOrder) || 0,
      })
      setEditing(false)
      onChanged()
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function cancel() {
    setName(item.name)
    setSortOrder(item.sortOrder)
    setEditing(false)
  }

  async function remove() {
    if (!window.confirm(`"${item.name}" 카테고리를 삭제할까요?`)) return
    setBusy(true)
    try {
      await deleteCategory(item.id)
      onChanged()
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <li className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:w-24"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            저장
          </button>
          <button
            onClick={cancel}
            disabled={busy}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            취소
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">
          {item.name}
        </p>
        <p className="flex flex-wrap gap-x-3 text-xs text-neutral-500">
          <span>프레임 {frameCount}개</span>
          <span>정렬 순서 {item.sortOrder}</span>
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
          disabled={busy}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 disabled:opacity-50"
        >
          삭제
        </button>
      </div>
    </li>
  )
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
