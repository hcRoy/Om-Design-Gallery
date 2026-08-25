import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { IconX } from "./admin/icons.jsx";

/**
 * Reusable modal shell. Handles ESC to close, backdrop click,
 * and returns focus to the trigger element on close.
 *
 * After returning from another browser tab, browsers sometimes deliver
 * a synthetic click that would hit the backdrop and close the modal —
 * we ignore backdrop clicks for a short window after visibility returns.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  variant = "default",
}) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const ignoreBackdropUntilRef = useRef(0);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      dialogRef.current?.focus();
    } else {
      triggerRef.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        ignoreBackdropUntilRef.current = Date.now() + 400;
      }
    };
    window.addEventListener("keydown", handleKey);
    document.addEventListener("visibilitychange", handleVisibility);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const handleBackdropClick = () => {
    if (Date.now() < ignoreBackdropUntilRef.current) return;
    onClose();
  };

  const widths = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-desc" : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative bg-white rounded-2xl shadow-card w-full ${widths[size] ?? widths.md}
                        max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-ink/5`}
          >
            <div
              className={`flex items-start justify-between gap-4 px-6 py-5 border-b shrink-0 ${
                variant === "destructive"
                  ? "border-maroon/10 bg-maroon/[0.03]"
                  : "border-ink/8"
              }`}
            >
              <div className="min-w-0">
                {title && (
                  <h3
                    id="modal-title"
                    className="text-xl md:text-2xl font-display text-ink leading-tight"
                  >
                    {title}
                  </h3>
                )}
                {description && (
                  <p id="modal-desc" className="text-sm text-ink-soft mt-1">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-lg text-ink-soft hover:text-ink hover:bg-sand
                           inline-flex items-center justify-center transition-colors duration-150 shrink-0"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
              {children}
            </div>

            {footer && (
              <div className="px-6 py-4 border-t border-ink/8 bg-sand/40 flex items-center justify-end gap-2.5 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
