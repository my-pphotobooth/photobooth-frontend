import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../../hooks/useCamera'
import {
  getShotCount,
  getSlotAspectAt,
  getSlotAt,
  getShotOverlays,
  getCanvasOverlays,
  getFrameLayout,
} from '../../data/frames'
import { OverlayLayer } from './OverlayLayer'

const COUNTDOWN_START = 3

export default function CaptureStep({ frame, onDone }) {
  const {
    videoRef,
    status,
    error,
    capture,
    mirrored,
    hasMultipleCameras,
    switchCamera,
  } = useCamera()
  // 프레임이 지정한 촬영 횟수(풀). 이 중 슬롯 수만큼 편집 단계에서 고른다.
  const totalShots = getShotCount(frame)
  const [phase, setPhase] = useState('idle')
  const [count, setCount] = useState(COUNTDOWN_START)
  const [shotIndex, setShotIndex] = useState(0)
  // 촬영 미리보기·캡처 비율 = 현재 컷이 들어갈 슬롯 비율 (저장본과 일치, 크롭 방지)
  const photoAspect = getSlotAspectAt(frame, shotIndex)
  // 프레임 전체 기준 오버레이는 지금 컷이 들어갈 슬롯만큼만 보인다.
  const layout = getFrameLayout(frame)
  const captureSlot = getSlotAt(frame, shotIndex)
  const canvasOverlays = getCanvasOverlays(frame)
  const capturedRef = useRef([])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (count === 0) {
      let cancelled = false
      ;(async () => {
        const blob = await capture({ aspectRatio: photoAspect })
        if (cancelled || !blob) return
        capturedRef.current = [...capturedRef.current, blob]
        setPhase('flash')
      })()
      return () => {
        cancelled = true
      }
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, count, capture, photoAspect])

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

  function handleStart() {
    capturedRef.current = []
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
        <div
          className={`relative overflow-hidden rounded-2xl bg-black ${
            photoAspect < 1
              ? 'w-full max-h-full sm:h-full sm:w-auto sm:max-w-full'
              : 'w-full max-h-full'
          }`}
          style={{ aspectRatio: photoAspect }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover ${
              mirrored ? 'scale-x-[-1]' : ''
            }`}
          />

          {hasMultipleCameras && !isRunning && phase !== 'done' && (
            <button
              type="button"
              onClick={switchCamera}
              disabled={status !== 'ready'}
              aria-label="전면/후면 카메라 전환"
              title="전면/후면 카메라 전환"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CameraSwitchIcon />
            </button>
          )}

          {/* 프레임 전체 기준 오버레이 — 캔버스를 이 컷의 슬롯 구멍으로 내다보듯
              스케일해서, 슬롯에 걸치는 부분만 셀 안에 보이게 한다. */}
          {canvasOverlays.length > 0 && captureSlot && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${(-captureSlot.x / captureSlot.width) * 100}%`,
                top: `${(-captureSlot.y / captureSlot.height) * 100}%`,
                width: `${(layout.canvas.width / captureSlot.width) * 100}%`,
                height: `${(layout.canvas.height / captureSlot.height) * 100}%`,
              }}
            >
              <OverlayLayer layout={layout} canvasOverlays={canvasOverlays} />
            </div>
          )}

          {getShotOverlays(frame, shotIndex).map((o, i) => (
            <img
              key={`${o.src}-${i}`}
              crossOrigin="anonymous"
              src={o.src}
              alt=""
              draggable="false"
              className="pointer-events-none absolute w-auto max-w-none"
              style={{
                right: `${o.right * 100}%`,
                bottom: `${o.bottom * 100}%`,
                height: `${o.height * 100}%`,
              }}
            />
          ))}

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

function CameraSwitchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      {/* 회전 화살표 링 — 호 끝에 삼각 화살촉을 접선 방향으로 붙인다 */}
      <path
        d="M11.54 3.21A8.8 8.8 0 0 1 17.66 18.74"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M14.6 21.31 19.14 20.5 16.18 16.98Z" fill="currentColor" />
      <path
        d="M12.46 20.79A8.8 8.8 0 0 1 6.34 5.26"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M9.4 2.69 4.86 3.5 7.82 7.02Z" fill="currentColor" />
      {/* 카메라 본체 (렌즈는 evenodd 로 뚫는다) */}
      <path
        d="M6.2 10.9A1.3 1.3 0 0 1 7.5 9.6h2.4l1.3-1.9h1.6l1.3 1.9h2.4a1.3 1.3 0 0 1 1.3 1.3v4.4a1.3 1.3 0 0 1-1.3 1.3H7.5a1.3 1.3 0 0 1-1.3-1.3ZM14.2 13.1A2.2 2.2 0 1 1 9.8 13.1 2.2 2.2 0 1 1 14.2 13.1Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  )
}

function Overlay({ children }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
      {children}
    </div>
  )
}
