const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const TOKEN_KEY = 'gangmin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export class UnauthorizedError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function jreq(method, path, body) {
  const init = { method, headers: { ...authHeaders() } }
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const res = await fetch(`${API}${path}`, init)
  if (res.status === 401) {
    setToken(null)
    throw new UnauthorizedError('인증이 만료됐어요. 다시 로그인 해주세요.')
  }
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

export async function login(password) {
  const res = await fetch(`${API}/api/gangmin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    let message = `login failed: ${res.status}`
    try {
      const err = await res.json()
      if (err?.error) message = err.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  const data = await res.json()
  if (!data?.token) throw new Error('no token in response')
  setToken(data.token)
  return data.token
}

export function logout() {
  setToken(null)
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

export const cleanupUploads = () => jreq('POST', '/api/gangmin/cleanup-uploads')

export async function fetchAdminTapes() {
  const data = await jreq('GET', '/api/gangmin/tapes')
  return data.items
}

export async function createTape({ name, file, sortOrder = 0, active = true }) {
  const fd = new FormData()
  fd.append('name', name)
  fd.append('file', file)
  fd.append('sortOrder', String(sortOrder))
  fd.append('active', String(active))
  const res = await fetch(`${API}/api/gangmin/tapes`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: fd,
  })
  if (res.status === 401) {
    setToken(null)
    throw new UnauthorizedError('인증이 만료됐어요. 다시 로그인 해주세요.')
  }
  if (!res.ok) {
    let message = `upload failed: ${res.status}`
    try {
      const err = await res.json()
      if (err?.error) message = err.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return res.json()
}

export const updateTape = (id, data) =>
  jreq('PATCH', `/api/gangmin/tapes/${id}`, data)
export const deleteTape = (id) => jreq('DELETE', `/api/gangmin/tapes/${id}`)

export async function uploadAdminFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${API}/api/gangmin/uploads`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: fd,
  })
  if (res.status === 401) {
    setToken(null)
    throw new UnauthorizedError('인증이 만료됐어요. 다시 로그인 해주세요.')
  }
  if (!res.ok) {
    let message = `upload failed: ${res.status}`
    try {
      const err = await res.json()
      if (err?.error) message = err.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return res.json()
}
