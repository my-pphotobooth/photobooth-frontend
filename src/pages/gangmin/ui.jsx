import { createContext, useCallback, useContext, useRef, useState } from 'react'

// ----- Toast -----

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random()
    const type = options.type ?? 'success'
    const duration = options.duration ?? 3000
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, duration)
  }, [])

  const value = {
    success: (msg) => show(msg, { type: 'success' }),
    error: (msg) => show(msg, { type: 'error' }),
    info: (msg) => show(msg, { type: 'info' }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-sm rounded-md px-4 py-2 text-sm text-white shadow-lg ${
              t.type === 'error'
                ? 'bg-red-600'
                : t.type === 'info'
                ? 'bg-neutral-700'
                : 'bg-emerald-600'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast outside ToastProvider')
  return ctx
}

// ----- Confirm -----

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const resolveRef = useRef(null)

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setState({
        title: opts.title ?? '확인',
        message: opts.message ?? '',
        confirmLabel: opts.confirmLabel ?? '확인',
        cancelLabel: opts.cancelLabel ?? '취소',
        danger: opts.danger ?? false,
      })
    })
  }, [])

  function handleClose(result) {
    resolveRef.current?.(result)
    resolveRef.current = null
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => handleClose(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-neutral-900">
              {state.title}
            </h3>
            {state.message && (
              <p className="mt-2 text-sm text-neutral-600 whitespace-pre-line">
                {state.message}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
              >
                {state.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                  state.danger ? 'bg-red-600' : 'bg-neutral-900'
                }`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm outside ConfirmProvider')
  return confirm
}

// ----- Display primitives -----

export function Spinner({ label = '불러오는 중…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm text-neutral-500">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({ icon = '📭', title, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="text-3xl">{icon}</div>
      <p className="text-sm text-neutral-500">{title}</p>
      {action}
    </div>
  )
}

export function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      <span className="wrap-break-word">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 shrink-0 text-red-500 hover:text-red-900"
        >
          ×
        </button>
      )}
    </div>
  )
}
