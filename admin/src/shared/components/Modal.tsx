import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ActionButton } from "./ActionButton";

/**
 * Modal — accessible dialog for focused tasks (forms, confirmations, details).
 *
 * Built without external libs so we have predictable focus-trap and animation
 * behavior. Always prefer this over inline forms for create/edit flows.
 *
 * Accessibility:
 *   - role="dialog", aria-modal, aria-labelledby/aria-describedby.
 *   - Tab navigation is trapped inside the dialog.
 *   - Escape closes the dialog (unless caller suppresses it).
 *   - Focus is restored to the previously-focused element on close.
 *   - Body scroll is locked while open.
 *
 * Documentation: /doc/admin-design-system.md#modals
 */
type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  /** When false, clicking the overlay does NOT dismiss the modal. */
  closeOnOverlayClick?: boolean;
  /** Hide the X close affordance for tasks that must use a footer button. */
  hideCloseButton?: boolean;
};

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  closeOnOverlayClick = true,
  hideCloseButton,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirst = () => {
      const node = dialogRef.current;
      if (!node) return;
      const focusable = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      (focusable[0] ?? node).focus();
    };
    const focusTimer = window.setTimeout(focusFirst, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const titleId = "modal-title";
  const descId = description ? "modal-desc" : undefined;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      aria-hidden="false"
    >
      <div
        className="absolute inset-0 bg-[var(--md-sys-color-scrim)]"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={[
          "relative w-full",
          "bg-[var(--md-sys-color-surface)]",
          "border border-[var(--md-sys-color-outline-variant)]",
          "shadow-level5 rounded-t-xl sm:rounded-lg",
          "flex flex-col max-h-[92vh] sm:max-h-[88vh]",
          "animate-slideUp",
          sizeStyles[size],
        ].join(" ")}
      >
        <header className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[15px] sm:text-base font-semibold text-[var(--md-sys-color-on-surface)] leading-tight"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descId}
                className="text-[13px] text-[var(--md-sys-color-on-surface-variant)] mt-1 leading-snug"
              >
                {description}
              </p>
            ) : null}
          </div>
          {!hideCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-1.5 -mr-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </header>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">{children}</div>
        {footer ? (
          <footer className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-5 sm:px-6 py-3.5 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/**
 * ConfirmDialog — opinionated wrapper for destructive / important
 * confirmations.
 *
 * @example
 *   <ConfirmDialog
 *     open={open}
 *     onConfirm={async () => deleteItem(id)}
 *     onClose={() => setOpen(false)}
 *     title="Delete invoice?"
 *     message="This will permanently remove the invoice and its line items."
 *     confirmLabel="Delete"
 *     tone="danger"
 *   />
 */
type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  isLoading?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <ActionButton tone="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </ActionButton>
          <ActionButton
            tone={tone === "danger" ? "danger" : "primary"}
            onClick={() => onConfirm()}
            isLoading={isLoading}
          >
            {confirmLabel}
          </ActionButton>
        </>
      }
    >
      {typeof message === "string" ? (
        <p className="text-sm text-[var(--md-sys-color-on-surface)] leading-6">
          {message}
        </p>
      ) : (
        message
      )}
    </Modal>
  );
}
