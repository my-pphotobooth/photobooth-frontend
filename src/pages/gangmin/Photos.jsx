import { useEffect, useState } from 'react'
import {
  deleteAdminPhoto,
  fetchAdminPhotos,
  updateAdminPhoto,
} from '../../api/gangmin'
import { fetchTapes } from '../../api/tapes'
import { EmptyState, ErrorBanner, Spinner, useConfirm, useToast } from './ui'

export default function Photos() {
  const [items, setItems] = useState([])
  const [tapes, setTapes] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const toast = useToast()
  const confirm = useConfirm()

  async function load(initial = false) {
    try {
      const data = await fetchAdminPhotos(
        initial ? {} : { cursor, limit: 24 },
      )
      setItems((prev) => (initial ? data.items : [...prev, ...data.items]))
      setCursor(data.nextCursor)
      setHasMore(Boolean(data.nextCursor))
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    load(true)
    fetchTapes()
      .then(setTapes)
      .catch((err) => console.warn('failed to load tapes:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    await load(false)
    setLoadingMore(false)
  }

  async function handleDelete(photo) {
    const ok = await confirm({
      title: '사진 삭제',
      message: '이 사진을 벽에서 삭제할까요?\n복구하려면 DB 직접 수정이 필요합니다.',
      confirmLabel: '삭제',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteAdminPhoto(photo.id)
      setItems((prev) => prev.filter((p) => p.id !== photo.id))
      toast.success('삭제했어요')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSaveTape(photo, tapeId) {
    try {
      const updated = await updateAdminPhoto(photo.id, { tapeId })
      setItems((prev) => prev.map((p) => (p.id === photo.id ? updated : p)))
      setEditingId(null)
      toast.success('테이프를 변경했어요')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-900">사진</h1>
      </header>

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {status === 'loading' && <Spinner />}

      {status === 'ready' && items.length === 0 && (
        <EmptyState icon="🖼️" title="아직 벽에 붙여진 사진이 없어요" />
      )}

      {status === 'ready' && items.length > 0 && (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={() => handleDelete(photo)}
                onChangeTape={() => setEditingId(photo.id)}
              />
            ))}
          </ul>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
              >
                {loadingMore ? '불러오는 중…' : '더 보기'}
              </button>
            </div>
          )}
        </>
      )}

      {editingId && (
        <TapeEditModal
          photo={items.find((p) => p.id === editingId)}
          tapes={tapes}
          onCancel={() => setEditingId(null)}
          onConfirm={(tapeId) =>
            handleSaveTape(items.find((p) => p.id === editingId), tapeId)
          }
        />
      )}
    </section>
  )
}

function PhotoCard({ photo, onDelete, onChangeTape }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-2">
      <div className="overflow-hidden rounded-md bg-neutral-50">
        <img
          src={photo.url}
          alt=""
          loading="lazy"
          className="block w-full"
        />
      </div>
      <div className="flex flex-col gap-0.5 px-1 text-xs text-neutral-500">
        <span>{formatDate(photo.createdAt)}</span>
        <span className="flex flex-wrap gap-x-2">
          {photo.frameName && <span>프레임: {photo.frameName}</span>}
          <span>테이프: {photo.tape ? photo.tape.name : '없음'}</span>
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onChangeTape}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50"
        >
          테이프 변경
        </button>
        <button
          onClick={onDelete}
          className="flex-1 rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
        >
          삭제
        </button>
      </div>
    </li>
  )
}

function TapeEditModal({ photo, tapes, onCancel, onConfirm }) {
  const [selectedId, setSelectedId] = useState(photo?.tape?.id ?? null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-3">
          <h3 className="text-base font-bold text-neutral-900">테이프 변경</h3>
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-700"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button
              onClick={() => setSelectedId(null)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 bg-neutral-50 p-2 transition ${
                selectedId === null
                  ? 'border-neutral-900'
                  : 'border-transparent hover:border-neutral-300'
              }`}
            >
              <div className="flex h-8 w-full items-center justify-center text-xs text-neutral-400">
                ✕
              </div>
              <span className="text-xs text-neutral-700">없음</span>
            </button>
            {tapes.map((tape) => {
              const isSelected = tape.id === selectedId
              return (
                <button
                  key={tape.id}
                  onClick={() => setSelectedId(tape.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 bg-neutral-50 p-2 transition ${
                    isSelected
                      ? 'border-neutral-900'
                      : 'border-transparent hover:border-neutral-300'
                  }`}
                >
                  <img
                    src={tape.url}
                    alt=""
                    className="h-8 w-full object-contain"
                  />
                  <span className="truncate text-xs text-neutral-700">
                    {tape.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-neutral-200 px-5 py-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(selectedId)}
            className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            확정
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}
