import {
  getFrameLayout,
  getFooterY,
  normalizeOverlays,
  overlayBox,
} from '../data/frames'

export async function composeFrame({
  frame,
  photoBlobs,
  filterCss,
  overlays = [],
  canvasOverlays = [],
}) {
  const layout = getFrameLayout(frame)
  const { width: canvasWidth, height: canvasHeight } = layout.canvas
  const slots = layout.slots

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('canvas context is not available')
  }

  ctx.fillStyle = frame.backgroundColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // overlays[i] = i번째 슬롯에 얹을 오버레이들. 구버전 호출(항목 하나짜리 객체)도 받는다.
  const slotOverlays = slots.map((_, i) => toOverlayItems(overlays[i]))
  const topOverlays = normalizeOverlays(canvasOverlays)

  // 이미지를 src 단위로 한 번씩만 받아온다. (같은 스티커를 여러 슬롯에 재사용)
  const srcs = [
    ...new Set(
      [...slotOverlays.flat(), ...topOverlays].map((o) => o.src),
    ),
  ]
  const [images, loadedOverlays, frameImage] = await Promise.all([
    Promise.all(photoBlobs.map(loadBlobAsImage)),
    Promise.all(srcs.map(loadImageFromSrc)),
    frame.frameImageUrl ? loadImageFromSrc(frame.frameImageUrl) : null,
  ])
  const overlayImages = new Map(srcs.map((src, i) => [src, loadedOverlays[i]]))

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const img = images[i]
    if (!img) continue

    // 사진과 clip 오버레이는 자기 슬롯 모양에 클립 — 옆 컷/프레임 영역 침범 X
    ctx.save()
    slotPath(ctx, slot)
    ctx.clip()

    const canUseFilter = 'filter' in ctx
    if (canUseFilter) {
      ctx.filter = filterCss && filterCss !== 'none' ? filterCss : 'none'
    }
    drawImageCover(ctx, img, slot.x, slot.y, slot.width, slot.height)
    if (canUseFilter) {
      ctx.filter = 'none'
    }

    for (const o of slotOverlays[i]) {
      if (!o.clip) continue
      drawOverlay(ctx, overlayImages.get(o.src), o, slot, layout.canvas)
    }

    ctx.restore()
  }

  if (frameImage) {
    // 프레임 이미지를 오프스크린에 그린 뒤 슬롯 모양만큼 도려내고(main 사진은 보존)
    // 사진 위에 얹어 구멍으로 사진이 비치게 한다.
    const off = document.createElement('canvas')
    off.width = canvasWidth
    off.height = canvasHeight
    const octx = off.getContext('2d')
    if (octx) {
      octx.drawImage(frameImage, 0, 0, canvasWidth, canvasHeight)
      octx.globalCompositeOperation = 'destination-out'
      for (const slot of slots) {
        slotPath(octx, slot)
        octx.fill()
      }
      ctx.drawImage(off, 0, 0)
    }
  } else {
    // 색상 프레임: 푸터 텍스트를 그린다. (이미지 프레임은 자체 브랜딩 포함 → 생략)
    // 하단 여백이 부족하면(getFooterY === null) 그리지 않아 프레임 밖으로 안 넘친다.
    const footerY = getFooterY(layout)
    if (footerY != null && frame.footerText) {
      ctx.fillStyle = frame.textColor
      ctx.font =
        '500 28px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = '4px'
      }
      ctx.fillText(frame.footerText, canvasWidth / 2, footerY)
    }
  }

  // 안 잘리는 오버레이는 맨 위에. 프레임 이미지·푸터까지 다 그린 뒤라야
  // 슬롯 밖(프레임 여백)으로 삐져나온 부분이 덮이지 않는다.
  for (let i = 0; i < slots.length; i++) {
    for (const o of slotOverlays[i]) {
      if (o.clip) continue
      drawOverlay(ctx, overlayImages.get(o.src), o, slots[i], layout.canvas)
    }
  }
  for (const o of topOverlays) {
    drawOverlay(ctx, overlayImages.get(o.src), o, null, layout.canvas)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('canvas export failed'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

// 슬롯 하나에 얹을 오버레이 목록으로 정규화.
// 구버전 호출부는 오버레이 객체 하나(또는 null)를 넘긴다.
function toOverlayItems(entry) {
  if (!entry) return []
  return normalizeOverlays(Array.isArray(entry) ? entry : [entry])
}

// overlayBox가 캔버스 우/하단 기준 거리를 주므로 슬롯·캔버스 앵커를 같은 식으로 그린다.
function drawOverlay(ctx, img, overlay, slot, canvasSize) {
  if (!img) return
  const box = overlayBox(overlay, slot, canvasSize)
  const ow = box.height * (img.width / img.height)
  ctx.drawImage(
    img,
    canvasSize.width - box.right - ow,
    canvasSize.height - box.bottom - box.height,
    ow,
    box.height,
  )
}

// 슬롯 모양에 맞는 경로를 현재 path로 설정. (rect / 둥근 rect / ellipse)
function slotPath(ctx, slot) {
  ctx.beginPath()
  if (slot.shape === 'ellipse') {
    const rx = slot.width / 2
    const ry = slot.height / 2
    ctx.ellipse(slot.x + rx, slot.y + ry, rx, ry, 0, 0, Math.PI * 2)
    return
  }
  const radius = Math.min(slot.radius || 0, slot.width / 2, slot.height / 2)
  if (radius > 0 && typeof ctx.roundRect === 'function') {
    ctx.roundRect(slot.x, slot.y, slot.width, slot.height, radius)
  } else {
    ctx.rect(slot.x, slot.y, slot.width, slot.height)
  }
}

function loadBlobAsImage(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

async function loadImageFromSrc(src) {
  try {
    const res = await fetch(src, {
      mode: 'cors',
      credentials: 'omit',
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const blob = await res.blob()
    return await loadBlobAsImage(blob)
  } catch (err) {
    throw new Error(
      `failed to load image: ${src} (${err?.message ?? 'unknown'})`,
    )
  }
}

function drawImageCover(ctx, img, dx, dy, dw, dh) {
  const imgRatio = img.width / img.height
  const slotRatio = dw / dh
  let sx = 0
  let sy = 0
  let sw = img.width
  let sh = img.height

  if (imgRatio > slotRatio) {
    sw = Math.round(img.height * slotRatio)
    sx = Math.round((img.width - sw) / 2)
  } else if (imgRatio < slotRatio) {
    sh = Math.round(img.width / slotRatio)
    sy = Math.round((img.height - sh) / 2)
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}
