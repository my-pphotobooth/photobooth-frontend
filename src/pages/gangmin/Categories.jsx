import { useEffect, useMemo, useState } from 'react'
import {
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  fetchAdminFrames,
  updateCategory,
} from '../../api/gangmin'
import { nextSortOrder } from './sortOrder'
import { EmptyState, ErrorBanner, Spinner } from './ui'
import { useConfirm, useToast } from './uiHooks'

export default function Categories() {
  const [items, setItems] = useState([])
  const [frames, setFrames] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const toast = useToast()

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

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchAdminCategories(), fetchAdminFrames()])
      .then(([cats, frs]) => {
        if (cancelled) return
        setItems(cats)
        setFrames(frs)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const frameCountByCategory = useMemo(() => {
    const map = new Map()
    for (const f of frames) {
      map.set(f.categoryId, (map.get(f.categoryId) ?? 0) + 1)
    }
    return map
  }, [frames])

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-900">카테고리</h1>
      </header>

      <NewCategoryRow
        key={nextSortOrder(items)}
        defaultOrder={nextSortOrder(items)}
        onCreated={() => {
          toast.success('카테고리를 추가했어요')
          reload()
        }}
        onError={setError}
      />

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {status === 'loading' && <Spinner />}

      {status === 'ready' && items.length === 0 && (
        <EmptyState icon="🗂️" title="아직 카테고리가 없어요" />
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

function NewCategoryRow({ defaultOrder = 0, onCreated, onError }) {
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState(defaultOrder)
  const [isBasic, setIsBasic] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await createCategory({
        name: name.trim(),
        sortOrder: Number(sortOrder) || 0,
        isBasic,
      })
      setName('')
      setSortOrder(defaultOrder)
      setIsBasic(false)
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
      className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center"
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
      <label className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-600">
        <input
          type="checkbox"
          checked={isBasic}
          onChange={(e) => setIsBasic(e.target.checked)}
        />
        기본 규격
      </label>
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
  const [isBasic, setIsBasic] = useState(item.isBasic)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

  async function save() {
    if (!name.trim()) return
    setBusy(true)
    try {
      await updateCategory(item.id, {
        name: name.trim(),
        sortOrder: Number(sortOrder) || 0,
        isBasic,
      })
      setEditing(false)
      toast.success('수정했어요')
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
    setIsBasic(item.isBasic)
    setEditing(false)
  }

  async function remove() {
    const ok = await confirm({
      title: '카테고리 삭제',
      message:
        frameCount > 0
          ? `"${item.name}"에 프레임 ${frameCount}개가 있어요.\n삭제하려면 먼저 프레임을 옮기거나 지워야 합니다.`
          : `"${item.name}" 카테고리를 삭제할까요?`,
      confirmLabel: '삭제',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await deleteCategory(item.id)
      toast.success('삭제했어요')
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
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-600">
          <input
            type="checkbox"
            checked={isBasic}
            onChange={(e) => setIsBasic(e.target.checked)}
          />
          기본 규격
        </label>
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
        <p className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          <span className="truncate">{item.name}</span>
          {item.isBasic && (
            <span className="shrink-0 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white">
              기본 규격
            </span>
          )}
        </p>
        <p className="flex flex-wrap gap-x-3 text-xs text-neutral-500">
          <span>
            {item.isBasic ? '규격+칩 방식' : `프레임 ${frameCount}개`}
          </span>
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
