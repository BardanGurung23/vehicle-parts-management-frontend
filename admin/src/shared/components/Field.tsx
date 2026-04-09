import type { PropsWithChildren } from "react";

type FieldProps = PropsWithChildren<{
  label: string;
  error?: string;
  hint?: string;
}>;

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}