import { useEffect, useRef, useState } from 'react'
import {
  createTape,
  createTapeCategory,
  deleteTape,
  deleteTapeCategory,
  fetchAdminTapeCategories,
  fetchAdminTapes,
  updateTape,
  updateTapeCategory,
} from '../../api/gangmin'
import { nextSortOrder } from './sortOrder'
import { ErrorBanner, Spinner } from './ui'
import { useConfirm, useToast } from './uiHooks'

export default function Tapes() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const toast = useToast()

  async function reload() {
    try {
      const [tapes, cats] = await Promise.all([
        fetchAdminTapes(),
        fetchAdminTapeCategories(),
      ])
      setItems(tapes)
      setCategories(cats)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchAdminTapes(), fetchAdminTapeCategories()])
      .then(([tapes, cats]) => {
        if (cancelled) return
        setItems(tapes)
        setCategories(cats)
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

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-900">테이프</h1>
      </header>

      <TapeCategoryManager
        categories={categories}
        onChanged={reload}
        onError={setError}
      />

      <NewTapeForm
        key={categories.map((c) => c.id).join(',')}
        categories={categories}
        tapes={items}
        onCreated={() => {
          toast.success('테이프를 추가했어요')
          reload()
        }}
        onError={setError}
      />

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {status === 'loading' && <Spinner />}

      {status === 'ready' &&
        categories.map((cat) => {
          const list = items.filter((t) => t.categoryId === cat.id)
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
                  이 분류에 테이프가 없어요
                </p>
              ) : (
                <ul className="divide-y divide-neutral-200">
                  {list.map((item) => (
                    <TapeRow
                      key={item.id}
                      item={item}
                      categories={categories}
                      onChanged={reload}
                      onError={setError}
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

function TapeCategoryManager({ categories, onChanged, onError }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

  async function add(e) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await createTapeCategory({
        name: name.trim(),
        sortOrder: nextSortOrder(categories),
      })
      setName('')
      toast.success('분류를 추가했어요')
      onChanged()
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function rename(cat) {
    const next = window.prompt('분류 이름', cat.name)
    if (next == null || !next.trim() || next.trim() === cat.name) return
    try {
      await updateTapeCategory(cat.id, { name: next.trim() })
      toast.success('수정했어요')
      onChanged()
    } catch (err) {
      onError(err.message)
    }
  }

  async function remove(cat) {
    const ok = await confirm({
      title: '분류 삭제',
      message: `"${cat.name}" 분류를 삭제할까요?\n안에 테이프가 있으면 먼저 옮겨야 합니다.`,
      confirmLabel: '삭제',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteTapeCategory(cat.id)
      toast.success('삭제했어요')
      onChanged()
    } catch (err) {
      onError(err.message)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-neutral-700"
      >
        <span>분류 관리 ({categories.length})</span>
        <span className="text-neutral-400">{open ? '접기' : '펼치기'}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-neutral-200 p-3">
          <form onSubmit={add} className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="새 분류 이름"
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              추가
            </button>
          </form>
          <ul className="divide-y divide-neutral-100">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-neutral-800">{cat.name}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => rename(cat)}
                    className="rounded border border-neutral-300 px-2 py-1 text-xs"
                  >
                    이름
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(cat)}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function NewTapeForm({ categories = [], tapes = [], onCreated, onError }) {
  const orderIn = (cid) =>
    nextSortOrder(tapes.filter((t) => t.categoryId === cid))
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [sortOrder, setSortOrder] = useState(() =>
    orderIn(categories[0]?.id ?? ''),
  )
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef(null)

  // 분류를 바꾸면 그 분류의 마지막 정렬 순서 + 1로 갱신
  function changeCategory(cid) {
    setCategoryId(cid)
    setSortOrder(orderIn(cid))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !file || !categoryId) return
    setBusy(true)
    try {
      await createTape({
        name: name.trim(),
        file,
        categoryId,
        sortOrder: Number(sortOrder) || 0,
      })
      setName('')
      setSortOrder((s) => (Number(s) || 0) + 1)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
        placeholder="테이프 이름"
        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      <select
        value={categoryId}
        onChange={(e) => changeCategory(e.target.value)}
        className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
      >
        <option value="" disabled>
          분류
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        placeholder="정렬"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:w-20"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      <button
        type="submit"
        disabled={busy || !name.trim() || !file || !categoryId}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        추가
      </button>
    </form>
  )
}

function TapeRow({ item, categories = [], onChanged, onError }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [categoryId, setCategoryId] = useState(item.categoryId)
  const [sortOrder, setSortOrder] = useState(item.sortOrder)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef(null)
  const toast = useToast()
  const confirm = useConfirm()

  async function save() {
    if (!name.trim()) return
    setBusy(true)
    try {
      await updateTape(item.id, {
        name: name.trim(),
        categoryId,
        sortOrder: Number(sortOrder) || 0,
        file: file ?? undefined,
      })
      setEditing(false)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
    setCategoryId(item.categoryId)
    setSortOrder(item.sortOrder)
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setEditing(false)
  }

  async function toggleActive() {
    setBusy(true)
    try {
      await updateTape(item.id, { active: !item.active })
      toast.success(item.active ? '비활성화했어요' : '활성화했어요')
      onChanged()
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    const ok = await confirm({
      title: '테이프 삭제',
      message: `"${item.name}" 테이프를 삭제할까요?\n이 테이프를 사용한 사진의 테이프 표시가 사라집니다.`,
      confirmLabel: '삭제',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await deleteTape(item.id)
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
      <li className="flex flex-col gap-2 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <img
            src={item.url}
            alt=""
            className="h-10 w-24 shrink-0 rounded border border-neutral-200 bg-neutral-50 object-contain"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:w-20"
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
        </div>
        <div className="flex items-center gap-2 pl-1 text-xs text-neutral-500">
          <span className="shrink-0">이미지 교체:</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs"
          />
          <span className="text-neutral-400">(선택 안 하면 기존 이미지 유지)</span>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 p-3">
      <img
        src={item.url}
        alt=""
        className="h-10 w-24 shrink-0 rounded border border-neutral-200 bg-neutral-50 object-contain"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">
          {item.name}
        </p>
        <p className="flex flex-wrap gap-x-3 text-xs text-neutral-500">
          <span>정렬 {item.sortOrder}</span>
          <span className={item.active ? 'text-emerald-600' : 'text-neutral-400'}>
            {item.active ? '활성' : '비활성'}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={toggleActive}
          disabled={busy}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {item.active ? '숨김' : '노출'}
        </button>
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
