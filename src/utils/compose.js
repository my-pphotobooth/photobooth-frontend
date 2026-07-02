import { getFrameLayout, getFooterY } from '../data/frames'

export async function composeFrame({
  frame,
  photoBlobs,
  filterCss,
  overlays = [],
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

  const [images, overlayImages, frameImage] = await Promise.all([
    Promise.all(photoBlobs.map(loadBlobAsImage)),
    Promise.all(
      overlays.map((o) => (o?.src ? loadImageFromSrc(o.src) : null)),
    ),
    frame.frameImageUrl ? loadImageFromSrc(frame.frameImageUrl) : null,
  ])

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const img = images[i]
    if (!img) continue

    // 사진과 오버레이 모두 자기 슬롯 모양에 클립 — 옆 컷/프레임 영역 침범 X
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

    const overlayImg = overlayImages[i]
    const overlayData = overlays[i]
    if (overlayImg && overlayData) {
      const oh = overlayData.height * slot.height
      const ow = oh * (overlayImg.width / overlayImg.height)
      const ox = slot.x + slot.width - ow - overlayData.right * slot.width
      const oy = slot.y + slot.height - oh - overlayData.bottom * slot.height
      ctx.drawImage(overlayImg, ox, oy, ow, oh)
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
