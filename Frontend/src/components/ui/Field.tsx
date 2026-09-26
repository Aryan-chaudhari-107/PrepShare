import React, { useId } from "react";
import { cn } from "../../lib/cn";

/* ── Field ──────────────────────────────────────────────────────────────────
   Wraps a control with a real <label for>, an optional hint and an error
   message wired up through aria-describedby / aria-invalid. The app previously
   had ZERO htmlFor / aria-label instances. */

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Rendered on the right of the label row (e.g. a "Forgot password?" link). */
  action?: React.ReactNode;
  /**
   * id placed on the hint/error paragraph so a control's `aria-describedby`
   * points at the SAME element the user can see — never a duplicate copy.
   */
  messageId?: string;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  hint,
  error,
  required,
  action,
  messageId,
  children,
  className,
}) => {
  // Derived from the control's own id, so the message element always has a
  // predictable id (`<control-id>-msg`) even when the caller passes nothing.
  const id = messageId ?? `${htmlFor}-msg`;

  const message = error ? (
    <p id={id} role="alert" className="text-sm text-danger">
      {error}
    </p>
  ) : hint ? (
    <p id={id} className="text-sm text-muted">
      {hint}
    </p>
  ) : null;

  // Point the control at the message the user can actually see, so no caller
  // can forget aria-describedby and leave the error unreachable by a screen
  // reader. An explicitly-set describedby is never overwritten.
  const controls = message
    ? React.Children.map(children, (child) =>
        React.isValidElement(child) && !("aria-describedby" in child.props)
          ? React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
              "aria-describedby": id,
            })
          : child
      )
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-heading">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {action}
      </div>
      {controls}
      {message}
    </div>
  );
};

/* ── Controls ─────────────────────────────────────────────────────────────── */

interface ControlBase {
  invalid?: boolean;
  className?: string;
}

const controlClass = (invalid?: boolean, extra?: string) =>
  cn("field", invalid && "border-danger focus:border-danger focus:ring-danger/20", extra);

export const Input: React.FC<
  ControlBase & React.InputHTMLAttributes<HTMLInputElement>
> = ({ invalid, className, ...rest }) => (
  <input className={controlClass(invalid, className)} aria-invalid={invalid || undefined} {...rest} />
);

export const Textarea: React.FC<
  ControlBase & React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = ({ invalid, className, ...rest }) => (
  <textarea
    className={cn(controlClass(invalid, "min-h-[104px] resize-y"), className)}
    aria-invalid={invalid || undefined}
    {...rest}
  />
);

export const Select: React.FC<
  ControlBase & React.SelectHTMLAttributes<HTMLSelectElement>
> = ({ invalid, className, children, ...rest }) => (
  <select
    className={cn(controlClass(invalid, "cursor-pointer appearance-none pr-9"), className)}
    aria-invalid={invalid || undefined}
    {...rest}
  >
    {children}
  </select>
);

/**
 * Convenience wrapper: label + control + validation in one call.
 * Generates a stable id so label, control and message stay associated.
 */
export interface FieldControlProps
  extends ControlBase,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "id"> {
  label: string;
  hint?: string;
  error?: string;
  action?: React.ReactNode;
  controlClassName?: string;
}

export const FieldControl: React.FC<FieldControlProps> = ({
  label,
  hint,
  error,
  action,
  required,
  invalid,
  controlClassName,
  ...rest
}) => {
  const id = useId();
  const describedBy = error || hint ? `${id}-msg` : undefined;

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      action={action}
      messageId={describedBy}
    >
      <Input
        id={id}
        invalid={invalid ?? Boolean(error)}
        aria-describedby={describedBy}
        required={required}
        className={controlClassName}
        {...rest}
      />
    </Field>
  );
};

/**
 * Password input with a reveal toggle. Announces its state so screen-reader
 * users know whether the value is currently masked.
 */
export const PasswordInput: React.FC<
  ControlBase & React.InputHTMLAttributes<HTMLInputElement>
> = ({ invalid, className, ...rest }) => {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={cn(controlClass(invalid, "pr-11"), className)}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:text-heading"
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
};
