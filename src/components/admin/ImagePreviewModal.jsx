import Modal from '../Modal.jsx'

/**
 * Lightweight full-size image preview for admin list thumbnails.
 * Uses the shared Modal shell (ESC, backdrop, focus restore).
 */
export default function ImagePreviewModal({
  open,
  onClose,
  src,
  title,
  description,
  alt,
}) {
  return (
    <Modal
      open={open && !!src}
      onClose={onClose}
      title={title || 'Image preview'}
      description={description}
      size="xl"
    >
      <div
        className="w-full min-h-[280px] max-h-[min(70vh,36rem)] aspect-square bg-sand
                   rounded-xl overflow-hidden flex items-center justify-center ring-1 ring-ink/8"
      >
        {src ? (
          <img
            src={src}
            alt={alt || title || 'Preview'}
            className="img-design max-h-full p-3"
          />
        ) : null}
      </div>
    </Modal>
  )
}

/**
 * Clickable thumbnail that opens ImagePreviewModal via onPreview.
 * Renders a plain non-interactive frame when there is no src.
 */
export function PreviewThumb({
  src,
  alt = '',
  onPreview,
  className = 'w-11 h-11',
  emptyIcon,
}) {
  if (!src) {
    return (
      <div
        className={`${className} rounded-lg bg-sand overflow-hidden shrink-0 ring-1 ring-ink/8
                    flex items-center justify-center text-ink-soft/40`}
      >
        {emptyIcon}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onPreview}
      aria-label={alt ? `Preview ${alt}` : 'Preview image'}
      title="Click to preview"
      className={`${className} rounded-lg bg-sand overflow-hidden shrink-0 ring-1 ring-ink/8
                  cursor-zoom-in transition-all duration-150
                  hover:ring-maroon/35 hover:shadow-sm focus:outline-none
                  focus-visible:ring-2 focus-visible:ring-maroon/40`}
    >
      <img src={src} alt="" className="img-design" />
    </button>
  )
}
