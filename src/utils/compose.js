import {
  FRAME_HEIGHT,
  FRAME_WIDTH,
  PHOTO_SLOT,
  getSlotPositions,
} from '../data/frames'

const FOOTER_Y =
  PHOTO_SLOT.paddingTop +
  4 * PHOTO_SLOT.height +
  3 * PHOTO_SLOT.gap +
  (FRAME_HEIGHT -
    (PHOTO_SLOT.paddingTop + 4 * PHOTO_SLOT.height + 3 * PHOTO_SLOT.gap)) /
    2

export async function composeFrame({ frame, photoBlobs, filterCss }) {
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_WIDTH
  canvas.height = FRAME_HEIGHT
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = frame.backgroundColor
  ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT)

  const images = await Promise.all(photoBlobs.map(loadBlobAsImage))
  const slots = getSlotPositions()

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const img = images[i]
    if (!img) continue

    ctx.save()
    ctx.filter = filterCss && filterCss !== 'none' ? filterCss : 'none'
    drawImageCover(ctx, img, slot.x, slot.y, slot.width, slot.height)
    ctx.restore()
  }

  ctx.fillStyle = frame.textColor
  ctx.font = '500 28px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = '4px'
  }
  ctx.fillText(frame.footerText, FRAME_WIDTH / 2, FOOTER_Y)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
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
