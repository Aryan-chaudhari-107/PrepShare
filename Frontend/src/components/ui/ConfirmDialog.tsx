import React from "react";
import { Modal } from "../common/Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  /** Spell out exactly what will be lost — never "Are you sure?". */
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
}

/**
 * Standard confirmation for destructive actions. Replaces two scattered
 * `window.confirm()` calls, which block the render thread, are trivially
 * dismissed and cannot be styled or tested.
 *
 * Defaults to focus on Cancel so an accidental Enter does not destroy data.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  loading = false,
}) => {
  const danger = tone === "danger";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      dismissOnBackdrop={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span
          className={
            danger
              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger"
              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning"
          }
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </span>
        <div className="text-sm text-body">{message}</div>
      </div>
    </Modal>
  );
};
