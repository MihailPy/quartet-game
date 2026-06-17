import type { ToastMessage } from '../types'

type ToastContainerProps = {
  toasts: ToastMessage[]
  onCloseToast: (toastID: string) => void
}

export function ToastContainer({ toasts, onCloseToast }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div className={`toast toast-${toast.type}`} key={toast.id}>
          <span>{toast.text}</span>

          <button
            className="toast-close-button"
            type="button"
            onClick={() => onCloseToast(toast.id)}
            aria-label="Закрыть уведомление"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
