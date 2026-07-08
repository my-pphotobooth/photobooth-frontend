import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPhotos } from '../api/photos'
import WallPhoto from '../components/wall/WallPhoto'
import WallSkeleton from '../components/wall/WallSkeleton'
import PhotoModal from '../components/wall/PhotoModal'
import { LeftArrow, RightArrow } from '../components/icons/Arrows'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function Wall() {
  useDocumentTitle('벽')
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('loading')
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const sentinelRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { items, nextCursor } = await fetchPhotos()
        if (cancelled) return
        setPhotos(items)
        setCursor(nextCursor)
        setHasMore(Boolean(nextCursor))
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        console.error(err)
        setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return
    setLoadingMore(true)
    try {
      const { items, nextCursor } = await fetchPhotos({ cursor })
      setPhotos((prev) => [...prev, ...items])
      setCursor(nextCursor)
      setHasMore(Boolean(nextCursor))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }, [cursor, hasMore, loadingMore])

  useEffect(() => {
    if (status !== 'ready' || !hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [status, hasMore, loadMore])

  return (
    <div className="min-h-screen bg-amber-50 px-6 py-6 sm:py-10">
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.8 0 0 0 0 0.75 0 0 0 0 0.6 0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between sm:mb-12">
          <Link
            to="/"
            className="flex items-center gap-1.5 font-handwriting text-base text-neutral-600 hover:text-neutral-900"
          >
            <LeftArrow className="h-3 w-auto" />
            홈
          </Link>
          <h1 className="font-handwriting text-2xl font-bold text-neutral-900 sm:text-3xl">벽</h1>
          <Link
            to="/booth"
            className="flex items-center gap-1.5 font-handwriting text-base text-neutral-600 hover:text-neutral-900"
          >
            찍으러 가기
            <RightArrow className="h-3 w-auto" />
          </Link>
        </header>

        {status === 'loading' && <WallSkeleton />}

        {status === 'error' && (
          <div className="py-20 text-center text-sm text-red-600">
            사진을 불러오지 못했어요
          </div>
        )}

        {status === 'ready' && photos.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="text-5xl">🖼️</div>
            <p className="text-neutral-600">
              아직 벽에 붙여진 사진이 없어요
            </p>
            <Link
              to="/booth"
              className="mt-2 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm text-white hover:bg-neutral-800"
            >
              첫 사진 찍기
            </Link>
          </div>
        )}

        {status === 'ready' && photos.length > 0 && (
          <>
            <div className="flex flex-wrap items-start justify-center gap-8 sm:gap-12">
              {photos.map((photo) => (
                <WallPhoto
                  key={photo.id}
                  photo={photo}
                  onClick={() => setSelectedPhoto(photo)}
                />
              ))}
            </div>

            {hasMore && (
              <div
                ref={sentinelRef}
                className="flex justify-center py-10"
              >
                {loadingMore ? (
                  <span className="text-sm text-neutral-500">불러오는 중…</span>
                ) : (
                  <button
                    onClick={loadMore}
                    className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm text-white hover:bg-neutral-800"
                  >
                    더 보기
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  )
}
