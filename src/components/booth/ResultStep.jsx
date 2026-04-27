import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFilterById } from '../../data/filters'
import { composeFrame } from '../../utils/compose'
import { uploadPhoto } from '../../api/photos'

export default function ResultStep({ frame, photos, editResult, onReset }) {
  const [composedBlob, setComposedBlob] = useState(null)
  const [status, setStatus] = useState('composing')
  const [errorMessage, setErrorMessage] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const selectedBlobs = editResult.selectedIndices.map(
          (i) => photos[i],
        )
        const selectedOverlays = editResult.selectedIndices.map(
          (i) => frame.overlays?.[i] ?? null,
        )
        const filter = getFilterById(editResult.filterId)
        const blob = await composeFrame({
          frame,
          photoBlobs: selectedBlobs,
          overlays: selectedOverlays,
          filterCss: filter.css,
        })
        if (cancelled) return
        setComposedBlob(blob)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        console.error(err)
        setErrorMessage(err?.message || '합성 중 오류가 발생했어요')
        setStatus('error')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [frame, photos, editResult])

  const composedUrl = useMemo(
    () => (composedBlob ? URL.createObjectURL(composedBlob) : null),
    [composedBlob],
  )

  function handleDownload() {
    if (!composedUrl) return
    const a = document.createElement('a')
    a.href = composedUrl
    a.download = `photobooth-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function handleShare() {
    if (!composedBlob) return
    setStatus('uploading')
    try {
      await uploadPhoto(composedBlob, { frameId: frame.id })
      setStatus('uploaded')
      setTimeout(() => navigate('/wall'), 700)
    } catch (err) {
      console.error(err)
      setErrorMessage(err?.message || '업로드에 실패했어요')
      setStatus('ready')
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          짜잔! 완성됐어요
        </h2>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
          다운로드 받거나 벽에 붙여보세요
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
        <div className="w-40 sm:w-56">
          {status === 'composing' || !composedUrl ? (
            <div className="flex aspect-2/6 w-full items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-500">
              합성하는 중…
            </div>
          ) : (
            <img
              src={composedUrl}
              alt="완성된 포토부스 사진"
              className="w-full rounded-lg shadow-xl"
            />
          )}
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3 sm:w-48">
          <button
            onClick={handleDownload}
            disabled={status !== 'ready' && status !== 'uploading' && status !== 'uploaded'}
            className="rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-900 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-neutral-50"
          >
            다운로드
          </button>
          <button
            onClick={handleShare}
            disabled={status !== 'ready'}
            className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-neutral-300 enabled:hover:bg-neutral-800"
          >
            {status === 'uploading' && '올리는 중…'}
            {status === 'uploaded' && '벽으로 이동합니다…'}
            {status !== 'uploading' && status !== 'uploaded' && '벽에 붙이기'}
          </button>
          <button
            onClick={onReset}
            className="text-xs text-neutral-500 hover:text-neutral-900"
          >
            다시 찍기
          </button>
          {errorMessage && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-center text-xs text-red-700">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
