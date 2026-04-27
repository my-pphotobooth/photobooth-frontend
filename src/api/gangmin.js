const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function jreq(method, path, body) {
  const init = { method }
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }
  const res = await fetch(`${API}${path}`, init)
  if (!res.ok) {
    let message = `${method} ${path} failed: ${res.status}`
    try {
      const err = await res.json()
      if (err?.error) message = err.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function fetchAdminCategories() {
  const data = await jreq('GET', '/api/gangmin/frame-categories')
  return data.items
}

export const createCategory = (data) =>
  jreq('POST', '/api/gangmin/frame-categories', data)
export const updateCategory = (id, data) =>
  jreq('PATCH', `/api/gangmin/frame-categories/${id}`, data)
export const deleteCategory = (id) =>
  jreq('DELETE', `/api/gangmin/frame-categories/${id}`)

export async function fetchAdminFrames() {
  const data = await jreq('GET', '/api/gangmin/frames')
  return data.items
}

export const fetchAdminFrame = (id) => jreq('GET', `/api/gangmin/frames/${id}`)
export const createFrame = (data) => jreq('POST', '/api/gangmin/frames', data)
export const updateFrame = (id, data) =>
  jreq('PATCH', `/api/gangmin/frames/${id}`, data)
export const deleteFrame = (id) => jreq('DELETE', `/api/gangmin/frames/${id}`)
