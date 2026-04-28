const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function fetchTapes() {
  const res = await fetch(`${API}/api/tapes`)
  if (!res.ok) throw new Error(`fetch tapes failed: ${res.status}`)
  const data = await res.json()
  return data.items
}
