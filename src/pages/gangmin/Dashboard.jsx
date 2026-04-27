import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAdminCategories,
  fetchAdminFrames,
} from '../../api/gangmin'

export default function Dashboard() {
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState(null)

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

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card to="/gangmin/categories" label="카테고리" count={counts?.categories} />
      <Card to="/gangmin/frames" label="프레임" count={counts?.frames} />
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
          {error}
        </p>
      )}
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
