import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)
export const ConfirmContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast outside ToastProvider')
  return ctx
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm outside ConfirmProvider')
  return confirm
}
