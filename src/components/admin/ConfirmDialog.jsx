import Modal from '../Modal.jsx'
import { IconAlert } from './icons.jsx'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  variant = 'destructive',
}) {
  const isDestructive = variant === 'destructive'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      variant={variant}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={isDestructive ? 'btn-danger' : 'btn-admin'}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        {isDestructive && (
          <div className="w-10 h-10 rounded-xl bg-maroon/10 text-maroon flex items-center justify-center shrink-0">
            <IconAlert className="w-5 h-5" />
          </div>
        )}
        <p className="text-sm text-ink-soft leading-relaxed pt-1">{description}</p>
      </div>
    </Modal>
  )
}
