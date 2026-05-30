import type { PropsWithChildren, ReactNode } from "react";

/**
 * FormSection — visual grouping for related fields inside a form.
 *
 * Adds a quiet section title and an optional description. Use multiple
 * sections to break long forms into scannable chunks (e.g. "Account",
 * "Vehicle", "Security" inside the registration form).
 *
 * Documentation: /doc/admin-design-system.md#forms
 */
type FormSectionProps = PropsWithChildren<{
  title: string;
  description?: ReactNode;
  className?: string;
}>;

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <fieldset className={className ?? "space-y-3"}>
      <legend className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--md-sys-color-on-surface-variant)] mb-1">
        {title}
      </legend>
      {description ? (
        <p className="text-[13px] text-[var(--md-sys-color-on-surface-variant)]">
          {description}
        </p>
      ) : null}
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}
