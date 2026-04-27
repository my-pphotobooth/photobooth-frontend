import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../api/gangmin'

export default function Login() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/gangmin'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password) return
    setBusy(true)
    setError(null)
    try {
      await login(password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-center text-lg font-bold text-neutral-900">
          관리자 로그인
        </h1>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-700">
            비밀번호
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !password}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </div>
  )
}
