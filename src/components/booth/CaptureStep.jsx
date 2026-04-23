import { useEffect, useMemo, useRef, useState } from 'react'
import { useCamera } from '../../hooks/useCamera'

const TOTAL_SHOTS = 8
const COUNTDOWN_START = 3
const PHOTO_ASPECT = 4 / 3

export default function CaptureStep({ frame, onDone }) {
  const { videoRef, status, error, capture } = useCamera()
  const [phase, setPhase] = useState('idle')
  const [count, setCount] = useState(COUNTDOWN_START)
  const [shotIndex, setShotIndex] = useState(0)
  const capturedRef = useRef([])
  const [previewUrls, setPreviewUrls] = useState([])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (count === 0) {
      let cancelled = false
      ;(async () => {
        const blob = await capture({ aspectRatio: PHOTO_ASPECT })
        if (cancelled || !blob) return
        capturedRef.current = [...capturedRef.current, blob]
        setPreviewUrls((prev) => [...prev, URL.createObjectURL(blob)])
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
      if (shotIndex < TOTAL_SHOTS - 1) {
        setShotIndex((i) => i + 1)
        setCount(COUNTDOWN_START)
        setPhase('countdown')
      } else {
        setPhase('done')
      }
    }, 900)
    return () => clearTimeout(timer)
  }, [phase, shotIndex])

  useEffect(() => {
    if (phase !== 'done') return
    onDone(capturedRef.current)
  }, [phase, onDone])

  function handleStart() {
    capturedRef.current = []
    setPreviewUrls([])
    setShotIndex(0)
    setCount(COUNTDOWN_START)
    setPhase('countdown')
  }

  const isRunning = phase !== 'idle' && phase !== 'done'
  const progressLabel = `${Math.min(shotIndex + (phase === 'idle' ? 0 : 1), TOTAL_SHOTS)} / ${TOTAL_SHOTS}`

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">촬영</h2>
        <span className="text-xs text-neutral-500 sm:text-sm">
          프레임: <span className="font-medium text-neutral-800">{frame?.name}</span> · {progressLabel}
        </span>
      </div>

      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-black">
        <div className="relative aspect-4/3 w-full">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
          />

          {frame?.type === 'with-me' && frame.overlays?.[shotIndex] && (
            <img
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

          {status === 'requesting' && (
            <Overlay>카메라를 준비 중이에요…</Overlay>
          )}
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

      <PhotoStrip count={TOTAL_SHOTS} urls={previewUrls} />

      <div className="flex justify-center pt-2">
        {!isRunning && phase !== 'done' && (
          <button
            onClick={handleStart}
            disabled={status !== 'ready'}
            className="rounded-xl bg-neutral-900 px-10 py-3 text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-neutral-300 enabled:hover:bg-neutral-800"
          >
            촬영 시작
          </button>
        )}
        {isRunning && (
          <div className="text-sm text-neutral-500">
            {phase === 'pause' ? '다음 컷 준비 중…' : '카메라를 바라봐주세요'}
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
  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-4 gap-1.5 sm:max-w-none sm:grid-cols-8 sm:gap-2">
      {slots.map((_, i) => (
        <div
          key={i}
          className="aspect-4/3 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100"
        >
          {urls[i] && (
            <img src={urls[i]} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      ))}
    </div>
  )
}
