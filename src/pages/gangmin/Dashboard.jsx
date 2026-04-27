import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  cleanupUploads,
  fetchAdminCategories,
  fetchAdminFrames,
} from '../../api/gangmin'
import { ErrorBanner, Spinner, useConfirm, useToast } from './ui'

export default function Dashboard() {
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState(null)
  const [cleaning, setCleaning] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cats, frames] = await Promise.all([
          fetchAdminCategories(),
          fetchAdminFrames(),
        ])
        if (cancelled) return
        setCounts({ categories: cats.length, frames: frames.length })
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCleanup() {
    const ok = await confirm({
      title: '고아 파일 정리',
      message:
        '어느 프레임에도 사용되지 않는 오버레이 이미지 파일을 디스크에서 삭제합니다. 진행할까요?',
      confirmLabel: '정리',
    })
    if (!ok) return
    setCleaning(true)
    try {
      const { deleted, kept } = await cleanupUploads()
      toast.success(`정리 완료: ${deleted}개 삭제, ${kept}개 유지`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {!counts && !error ? (
        <Spinner />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card to="/gangmin/categories" label="카테고리" count={counts?.categories} />
          <Card to="/gangmin/frames" label="프레임" count={counts?.frames} />
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-bold text-neutral-900">유지보수</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-600">
            업로드된 오버레이 이미지 중 어느 프레임에도 쓰이지 않는 파일을 삭제합니다.
          </p>
          <button
            type="button"
            onClick={handleCleanup}
            disabled={cleaning}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {cleaning ? '정리 중…' : '고아 파일 정리'}
          </button>
        </div>
      </section>
    </div>
  )
}

function Card({ to, label, count }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-400"
    >
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-900">
        {count ?? '…'}
      </p>
    </Link>
  )
}
