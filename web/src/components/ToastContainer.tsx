import type { ToastMessage } from '../types'

type ToastContainerProps = {
  toasts: ToastMessage[]
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div className={`toast toast-${toast.type}`} key={toast.id}>
          {toast.text}
        </div>
      ))}
    </div>
  )
}
