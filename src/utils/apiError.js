import toast from 'react-hot-toast'

export function notifyApiError(error, fallback) {
  if (error?.handledGlobally) return
  const message = error?.message || fallback
  toast.error(message.startsWith('Ошибка:') ? message : `Ошибка: ${message}`)
}

export function notifyApiErrorPlain(error, fallback) {
  if (error?.handledGlobally) return
  toast.error(error?.message || fallback)
}
