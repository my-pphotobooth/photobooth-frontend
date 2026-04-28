import { useEffect, useRef, useState } from 'react'
import {
  createTape,
  deleteTape,
  fetchAdminTapes,
  updateTape,
} from '../../api/gangmin'
import { EmptyState, ErrorBanner, Spinner, useConfirm, useToast } from './ui'

export default function Tapes() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const toast = useToast()

  async function reload() {
    try {
      const tapes = await fetchAdminTapes()
      setItems(tapes)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    reload()
  }, [])

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-900">테이프</h1>
      </header>

      <NewTapeForm
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

      {status === 'ready' && items.length === 0 && (
        <EmptyState icon="🎀" title="아직 테이프가 없어요" />
      )}

      {status === 'ready' && items.length > 0 && (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {items.map((item) => (
            <TapeRow
              key={item.id}
              item={item}
              onChanged={reload}
              onError={setError}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function NewTapeForm({ onCreated, onError }) {
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !file) return
    setBusy(true)
    try {
      await createTape({
        name: name.trim(),
        file,
        sortOrder: Number(sortOrder) || 0,
      })
      setName('')
      setSortOrder(0)
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
        disabled={busy || !name.trim() || !file}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        추가
      </button>
    </form>
  )
}

function TapeRow({ item, onChanged, onError }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
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
