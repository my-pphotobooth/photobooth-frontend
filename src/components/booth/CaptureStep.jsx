import { useEffect, useMemo, useRef, useState } from 'react'
import { useCamera } from '../../hooks/useCamera'
import { getShotCount } from '../../data/frames'

const COUNTDOWN_START = 3
const PHOTO_ASPECT = 4 / 3

export default function CaptureStep({ frame, onDone }) {
  const { videoRef, status, error, capture } = useCamera()
  // 프레임이 지정한 촬영 횟수(풀). 이 중 슬롯 수만큼 편집 단계에서 고른다.
  const totalShots = getShotCount(frame)
  const [phase, setPhase] = useState('idle')
  const [count, setCount] = useState(COUNTDOWN_START)
  const [shotIndex, setShotIndex] = useState(0)
  const capturedRef = useRef([])
  const [previewUrls, setPreviewUrls] = useState([])
  const previewUrlsRef = useRef([])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (count === 0) {
      let cancelled = false
      ;(async () => {
        const blob = await capture({ aspectRatio: PHOTO_ASPECT })
        if (cancelled || !blob) return
        capturedRef.current = [...capturedRef.current, blob]
        setPreviewUrls((prev) => {
          const next = [...prev, URL.createObjectURL(blob)]
          previewUrlsRef.current = next
          return next
        })
        setPhase('flash')
      })()
      return () => {
        cancelled = true
      }
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, count, capture])

  useEffect(() => {
    if (phase !== 'flash') return
    const timer = setTimeout(() => setPhase('pause'), 180)
    return () => clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'pause') return
    const timer = setTimeout(() => {
      if (shotIndex < totalShots - 1) {
        setShotIndex((i) => i + 1)
        setCount(COUNTDOWN_START)
        setPhase('countdown')
      } else {
        setPhase('done')
      }
    }, 900)
    return () => clearTimeout(timer)
  }, [phase, shotIndex, totalShots])

  useEffect(() => {
    if (phase !== 'done') return
    onDone(capturedRef.current)
  }, [phase, onDone])

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  function handleStart() {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    previewUrlsRef.current = []
    capturedRef.current = []
    setPreviewUrls([])
    setShotIndex(0)
    setCount(COUNTDOWN_START)
    setPhase('countdown')
  }

  const isRunning = phase !== 'idle' && phase !== 'done'
  const progressLabel = `${Math.min(
    shotIndex + (phase === 'idle' ? 0 : 1),
    totalShots,
  )} / ${totalShots}`

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">촬영</h2>
        <span className="text-xs text-neutral-500 sm:text-sm">
          프레임: <span className="font-medium text-neutral-800">{frame?.name}</span> · {progressLabel}
        </span>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 items-center justify-center">
        <div className="relative aspect-4/3 max-h-full w-full overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
          />

          {frame?.overlays?.[shotIndex] && (
            <img
              crossOrigin="anonymous"
              src={frame.overlays[shotIndex].src}
              alt=""
              draggable="false"
              className="pointer-events-none absolute w-auto"
              style={{
                right: `${frame.overlays[shotIndex].right * 100}%`,
                bottom: `${frame.overlays[shotIndex].bottom * 100}%`,
                height: `${frame.overlays[shotIndex].height * 100}%`,
              }}
            />
          )}

          {status === 'requesting' && <Overlay>카메라를 준비 중이에요...</Overlay>}
          {status === 'error' && (
            <Overlay>
              <div className="text-center">
                <div className="font-medium">카메라를 사용할 수 없어요</div>
                <div className="mt-1 text-xs opacity-80">
                  {error?.message || '권한을 허용했는지 확인해주세요'}
                </div>
              </div>
            </Overlay>
          )}
          {phase === 'countdown' && count > 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="text-8xl font-bold leading-none text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)] sm:text-[160px]">
                {count}
              </div>
            </div>
          )}
          {phase === 'flash' && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-white" />
          )}
        </div>
      </div>

      <PhotoStrip count={totalShots} urls={previewUrls} />

      <div className="flex h-12 shrink-0 items-center justify-center sm:h-14">
        {!isRunning && phase !== 'done' && (
          <button
            type="button"
            onClick={handleStart}
            disabled={status !== 'ready'}
            className="h-12 w-36 transition disabled:cursor-not-allowed disabled:opacity-35 disabled:grayscale enabled:hover:-translate-y-0.5 enabled:hover:drop-shadow-md enabled:active:translate-y-0 sm:h-14 sm:w-44"
          >
            <img
              src="/booth/take_picture_button.svg"
              alt="촬영 시작"
              className="h-full w-full object-contain"
            />
          </button>
        )}
        {isRunning && (
          <div className="text-sm text-neutral-500">
            {phase === 'pause' ? '다음 컷 준비 중...' : '카메라를 바라봐주세요'}
          </div>
        )}
      </div>
    </div>
  )
}

function Overlay({ children }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
      {children}
    </div>
  )
}

function PhotoStrip({ count, urls }) {
  const slots = useMemo(() => Array.from({ length: count }), [count])
  // 촬영 컷 수와 무관하게 항상 한 줄(고정 높이) + 넘치면 가로 스크롤.
  // 그래야 위쪽 카메라 영역(flex-1)이 찌부러지지 않는다.
  return (
    <div className="mx-auto flex w-full max-w-2xl shrink-0 justify-start gap-2 overflow-x-auto pb-1 sm:justify-center">
      {slots.map((_, i) => (
        <div
          key={i}
          className="aspect-4/3 h-12 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 sm:h-14"
        >
          {urls[i] && (
            <img src={urls[i]} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      ))}
    </div>
  )
}
