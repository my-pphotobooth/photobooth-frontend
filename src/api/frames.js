const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function fetchFrames() {
  const res = await fetch(`${API}/api/frames`)
  if (!res.ok) throw new Error(`fetch frames failed: ${res.status}`)
  const data = await res.json()
  return data.items
}

export async function fetchFrameCategories() {
  const res = await fetch(`${API}/api/frame-categories`)
  if (!res.ok) throw new Error(`fetch frame categories failed: ${res.status}`)
  const data = await res.json()
  return data.items
}
