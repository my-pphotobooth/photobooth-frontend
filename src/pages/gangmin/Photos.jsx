import { useEffect, useState } from 'react'
import { deleteAdminPhoto, fetchAdminPhotos } from '../../api/gangmin'
import { EmptyState, ErrorBanner, Spinner, useConfirm, useToast } from './ui'

export default function Photos() {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
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
    </section>
  )
}

function PhotoCard({ photo, onDelete }) {
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
          {photo.tape && <span>테이프: {photo.tape.name}</span>}
        </span>
      </div>
      <button
        onClick={onDelete}
        className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
      >
        삭제
      </button>
    </li>
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
