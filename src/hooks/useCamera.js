import { useCallback, useEffect, useRef, useState } from 'react'

export function useCamera({ width = 1280, height = 720, facingMode: initialFacingMode = 'user' } = {}) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState(initialFacingMode)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  // 전면(셀카)일 때만 좌우 반전 — 미리보기와 저장본이 같은 방향이어야 한다.
  const mirrored = facingMode === 'user'

  useEffect(() => {
    let cancelled = false

    async function start() {
      setStatus('requesting')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width, height, facingMode },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err)
        setStatus('error')
      }
    }

    start()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [width, height, facingMode])

  // 카메라 권한이 허용된 뒤에야 기기 목록이 제대로 보인다.
  useEffect(() => {
    if (status !== 'ready') return
    let cancelled = false
    navigator.mediaDevices
      ?.enumerateDevices?.()
      .then((devices) => {
        if (cancelled) return
        setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [status])

  const switchCamera = useCallback(() => {
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))
  }, [])

  const capture = useCallback(
    ({ aspectRatio } = {}) => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return null

      const vw = video.videoWidth
      const vh = video.videoHeight

      let sx = 0
      let sy = 0
      let sw = vw
      let sh = vh

      if (aspectRatio) {
        const videoRatio = vw / vh
        if (videoRatio > aspectRatio) {
          sw = Math.round(vh * aspectRatio)
          sx = Math.round((vw - sw) / 2)
        } else if (videoRatio < aspectRatio) {
          sh = Math.round(vw / aspectRatio)
          sy = Math.round((vh - sh) / 2)
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = sw
      canvas.height = sh
      const ctx = canvas.getContext('2d')

      if (mirrored) {
        ctx.translate(sw, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92)
      })
    },
    [mirrored],
  )

  return {
    videoRef,
    status,
    error,
    capture,
    facingMode,
    mirrored,
    hasMultipleCameras,
    switchCamera,
  }
}
