import Modal from './Modal'

export default function ConfirmDialog({
  open,
  title = 'Подтверждение',
  message,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg border border-dark-border text-sm text-gray-400 hover:bg-dark-hover"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-inter-semibold text-white ${
            danger
              ? 'bg-red-600 hover:bg-red-500'
              : 'btn-primary justify-center'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
