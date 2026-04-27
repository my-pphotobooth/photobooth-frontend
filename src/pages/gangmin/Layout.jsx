import { useEffect } from 'react'
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { getToken, logout } from '../../api/gangmin'
import { ConfirmProvider, ToastProvider } from './ui'

export default function GangminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex,nofollow'
    document.head.appendChild(meta)
    return () => {
      document.head.removeChild(meta)
    }
  }, [])

  if (!getToken()) {
    return (
      <Navigate to="/gangmin/login" state={{ from: location }} replace />
    )
  }

  function handleLogout() {
    logout()
    navigate('/gangmin/login', { replace: true })
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-screen bg-neutral-50">
          <header className="border-b border-neutral-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <Link to="/gangmin" className="text-sm font-bold text-neutral-900">
                관리
              </Link>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-neutral-500 hover:text-neutral-900"
                >
                  로그아웃
                </button>
                <Link
                  to="/"
                  className="text-xs text-neutral-500 hover:text-neutral-900"
                >
                  ← 사이트로
                </Link>
              </div>
            </div>
            <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
              <Tab to="/gangmin" end>
                대시보드
              </Tab>
              <Tab to="/gangmin/categories">카테고리</Tab>
              <Tab to="/gangmin/frames">프레임</Tab>
            </nav>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6">
            <Outlet />
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  )
}

function Tab({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `shrink-0 rounded-full px-3 py-1.5 text-sm transition ${
          isActive
            ? 'bg-neutral-900 text-white'
            : 'text-neutral-600 hover:bg-neutral-100'
        }`
      }
    >
      {children}
    </NavLink>
  )
}
