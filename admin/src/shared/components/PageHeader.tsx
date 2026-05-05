import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="space-y-1 min-w-0">
        {eyebrow && <p className="text-label-small text-primary uppercase tracking-wider">{eyebrow}</p>}
        <h1 className="text-headline-small text-on-surface font-semibold">{title}</h1>
        {description && <p className="text-body-medium text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
