import { useId, type PropsWithChildren } from "react";

type FieldProps = PropsWithChildren<{
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
}>;

export function Field({ label, error, hint, required, htmlFor, children }: FieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-on-surface-variant">
        {label}
        {required && <span className="ml-0.5 text-error" aria-hidden="true">*</span>}
      </label>
      <div aria-invalid={!!error} aria-describedby={describedBy}>
        {children}
      </div>
      {hint && !error && <p id={hintId} className="text-xs text-on-surface-variant">{hint}</p>}
      {error && <p id={errorId} className="text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}
