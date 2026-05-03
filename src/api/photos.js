const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function uploadPhoto(blob, { frameId, tapeId } = {}) {
  const fd = new FormData()
  fd.append('file', blob, 'photo.png')
  if (frameId) fd.append('frameId', frameId)
  if (tapeId) fd.append('tapeId', tapeId)
  const res = await fetch(`${API}/api/photos`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) throw new Error(`upload failed: ${res.status}`)
  return res.json()
}

export async function fetchPhotos({ cursor, limit } = {}) {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  if (limit) params.set('limit', String(limit))
  const qs = params.toString()
  const res = await fetch(`${API}/api/photos${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
  return res.json()
}
