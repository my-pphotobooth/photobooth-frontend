import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteBasicLayout,
  fetchAdminBasicLayouts,
} from '../../api/gangmin'
import FrameThumbnail from '../../components/booth/FrameThumbnail'
import { EmptyState, ErrorBanner, Spinner } from './ui'
import { useConfirm, useToast } from './uiHooks'

export default function BasicLayouts() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const toast = useToast()
  const confirm = useConfirm()

  function reload() {
    fetchAdminBasicLayouts()
      .then((rows) => {
        setItems(rows)
        setStatus('ready')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }

  useEffect(() => {
    reload()
  }, [])

  async function remove(item) {
    const ok = await confirm({
      title: '규격 삭제',
      message: `"${item.name}" 규격을 삭제할까요?`,
      confirmLabel: '삭제',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteBasicLayout(item.id)
      toast.success('삭제했어요')
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-900">기본 규격</h1>
        <Link
          to="/gangmin/basic-layouts/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          새 규격
        </Link>
      </header>

      <p className="text-xs text-neutral-500">
        기본 카테고리에서 보여줄 규격(레이아웃)이에요. 색은 촬영 후 컬러칩으로
        선택합니다.
      </p>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {status === 'loading' && <Spinner />}
      {status === 'ready' && items.length === 0 && (
        <EmptyState icon="📐" title="아직 규격이 없어요" />
      )}

      {status === 'ready' && items.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3"
            >
              <div className="flex w-full justify-center">
                <FrameThumbnail
                  heightClass="h-40"
                  frame={{
                    layout: item.layout,
                    footerText: item.footerText,
                    backgroundColor: '#ffffff',
                    slotColor: '#e5e7eb',
                    textColor: '#1f2937',
                    frameImageUrl: null,
                    overlays: null,
                  }}
                />
              </div>
              <p className="w-full truncate text-center text-sm font-medium text-neutral-800">
                {item.name}
              </p>
              <p className="text-[10px] text-neutral-400">
                {item.layout.canvas.width}×{item.layout.canvas.height} ·{' '}
                {item.layout.slots.length}칸
              </p>
              <div className="flex w-full gap-2">
                <Link
                  to={`/gangmin/basic-layouts/${item.id}/edit`}
                  className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-center text-xs"
                >
                  수정
                </Link>
                <button
                  onClick={() => remove(item)}
                  className="rounded-md border border-red-300 px-2 py-1.5 text-xs text-red-700"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
