import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFilterById } from '../../data/filters'
import { getFrameLayout } from '../../data/frames'
import { withChip } from '../../data/basicFrame'
import { composeFrame } from '../../utils/compose'
import { uploadPhoto } from '../../api/photos'
import { fetchTapes, fetchTapeCategories } from '../../api/tapes'

export default function ResultStep({
  frame,
  photos,
  editResult,
  onReset,
  colorChips = [],
}) {
  const canvas = getFrameLayout(frame).canvas
  const aspectRatio = `${canvas.width} / ${canvas.height}`
  const [composedBlob, setComposedBlob] = useState(null)
  const [status, setStatus] = useState('composing')
  const [errorMessage, setErrorMessage] = useState(null)
  const [errorDetail, setErrorDetail] = useState(null)
  const [tapes, setTapes] = useState([])
  const [tapeCategories, setTapeCategories] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const selectedBlobs = editResult.selectedIndices.map((i) => photos[i])
        const selectedOverlays = editResult.selectedIndices.map(
          (i) => frame.overlays?.[i] ?? null,
        )
        // 기본 프레임이면 선택한 컬러칩 색을 입혀서 합성
        const chip = frame.isBasic
          ? (colorChips.find((c) => c.id === editResult.colorChipId) ??
            colorChips[0] ??
            null)
          : null
        const filter = getFilterById(editResult.filterId)
        const blob = await composeFrame({
          frame: chip ? withChip(frame, chip) : frame,
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
        setErrorMessage('합성 중 오류가 발생했어요')
        setErrorDetail(formatErrorDetail(err))
        setStatus('error')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [frame, photos, editResult, colorChips])

  const composedUrl = useMemo(
    () => (composedBlob ? URL.createObjectURL(composedBlob) : null),
    [composedBlob],
  )

  useEffect(() => {
    return () => {
      if (!composedUrl) return
      window.setTimeout(() => URL.revokeObjectURL(composedUrl), 1000)
    }
  }, [composedUrl])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchTapes(), fetchTapeCategories()])
      .then(([items, cats]) => {
        if (cancelled) return
        setTapes(items)
        setTapeCategories(cats)
      })
      .catch((err) => {
        // 테이프 로드 실패는 치명적 X — 빈 목록으로 진행
        console.warn('failed to load tapes:', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleDownload() {
    if (!composedUrl) return
    const a = document.createElement('a')
    a.href = composedUrl
    a.download = `photobooth-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function handleConfirm(tapeId) {
    if (!composedBlob) return
    setPickerOpen(false)
    setStatus('uploading')
    setErrorMessage(null)
    setErrorDetail(null)
    try {
      await uploadPhoto(composedBlob, {
        frameId: frame.isBasic ? null : frame.id,
        tapeId,
      })
      setStatus('uploaded')
      setTimeout(() => navigate('/wall'), 700)
    } catch (err) {
      console.error(err)
      setErrorMessage('업로드에 실패했어요')
      setErrorDetail(formatErrorDetail(err))
      setStatus('ready')
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="shrink-0 text-center">
        <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          짜잔! 완성됐어요
        </h2>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
          다운로드 받거나 벽에 붙여보세요
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 sm:flex-row sm:gap-10">
        <div className="flex min-h-0 flex-1 items-center justify-center sm:h-full sm:flex-none">
          {status === 'composing' || !composedUrl ? (
            <div
              className="flex w-32 items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-500 sm:h-full sm:w-auto sm:max-w-full"
              style={{ aspectRatio }}
            >
              합성하는 중...
            </div>
          ) : (
            <img
              src={composedUrl}
              alt="완성된 포토부스 사진"
              className="w-32 rounded-lg object-contain shadow-xl sm:h-full sm:w-auto sm:max-w-full"
              style={{ aspectRatio }}
            />
          )}
        </div>

        <div className="flex w-full max-w-xs shrink-0 flex-col items-center gap-3 sm:w-48">
          <ImageActionButton
            label="다운로드"
            src="/booth/download_button.svg"
            disabled={
              status !== 'ready' &&
              status !== 'uploading' &&
              status !== 'uploaded'
            }
            onClick={handleDownload}
          />
          <ImageActionButton
            label="벽에 붙이고 가기"
            src="/booth/stick_to_wall_button.svg"
            disabled={status !== 'ready'}
            onClick={() => setPickerOpen(true)}
          />
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-neutral-500 hover:text-neutral-900"
          >
            다시 찍기
          </button>
          {errorMessage && (
            <ErrorDetails message={errorMessage} detail={errorDetail} />
          )}
        </div>
      </div>

      {pickerOpen && (
        <TapePickerModal
          tapes={tapes}
          categories={tapeCategories}
          onCancel={() => setPickerOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}

function ImageActionButton({ label, src, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="h-12 w-36 transition disabled:cursor-not-allowed disabled:opacity-35 disabled:grayscale enabled:hover:-translate-y-0.5 enabled:hover:drop-shadow-md enabled:active:translate-y-0 sm:h-14 sm:w-44"
    >
      <img src={src} alt="" className="h-full w-full object-contain" />
    </button>
  )
}

function ErrorDetails({ message, detail }) {
  return (
    <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
      <p className="text-center">{message}</p>
      {detail && (
        <details className="mt-2 text-left">
          <summary className="cursor-pointer select-none text-red-800">
            오류 상세
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-white/70 p-2 font-mono text-[10px] leading-relaxed text-red-900">
            {detail}
          </pre>
        </details>
      )}
    </div>
  )
}

function formatErrorDetail(err) {
  const lines = []
  lines.push(`name: ${err?.name ?? 'UnknownError'}`)
  lines.push(`message: ${err?.message ?? String(err)}`)
  if (err?.stack) {
    lines.push('stack:')
    lines.push(String(err.stack).split('\n').slice(0, 6).join('\n'))
  }
  lines.push(`userAgent: ${navigator.userAgent}`)
  return lines.join('\n')
}

function TapePickerModal({ tapes, categories = [], onCancel, onConfirm }) {
  const [selectedId, setSelectedId] = useState(null)
  const showTabs = categories.length > 1
  const [activeCat, setActiveCat] = useState(() =>
    showTabs
      ? (categories.find((c) => tapes.some((t) => t.categoryId === c.id))?.id ??
        categories[0]?.id ??
        null)
      : null,
  )
  const shown = showTabs
    ? tapes.filter((t) => t.categoryId === activeCat)
    : tapes
  const isEmpty = shown.length === 0

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
          <h3 className="text-base font-bold text-neutral-900">테이프 선택</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-700"
            aria-label="닫기"
          >
            x
          </button>
        </div>

        {showTabs && (
          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-neutral-100 px-5 py-2">
            {categories.map((c) => {
              const isActive = c.id === activeCat
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCat(c.id)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${
                    isActive
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-700'
                  }`}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isEmpty ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              준비된 테이프가 없어요
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shown.map((tape) => {
                const isSelected = tape.id === selectedId
                return (
                  <button
                    key={tape.id}
                    type="button"
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
          )}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-neutral-200 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700"
          >
            취소
          </button>
          {isEmpty ? (
            <button
              type="button"
              onClick={() => onConfirm(null)}
              className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              그냥 붙이기
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onConfirm(selectedId)}
              disabled={!selectedId}
              className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              확정
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
