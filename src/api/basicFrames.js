const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function fetchBasicLayouts() {
  const res = await fetch(`${API}/api/basic-layouts`)
  if (!res.ok) throw new Error(`fetch basic layouts failed: ${res.status}`)
  const data = await res.json()
  return data.items
}

export async function fetchColorChips() {
  const res = await fetch(`${API}/api/color-chips`)
  if (!res.ok) throw new Error(`fetch color chips failed: ${res.status}`)
  const data = await res.json()
  return data.items
}
