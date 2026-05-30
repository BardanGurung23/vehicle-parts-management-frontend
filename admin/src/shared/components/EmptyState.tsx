import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

/**
 * EmptyState — placeholder for collections, search results, or any panel
 * with no content yet. Communicates the reason and the next action.
 *
 * Documentation: /doc/admin-design-system.md#empty-state
 */
type EmptyStateProps = {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  embedded?: boolean;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  embedded,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <div className="w-11 h-11 rounded-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center mb-3">
        <Icon className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" aria-hidden="true" />
      </div>
      <h3 className="text-[15px] font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-sm mb-4">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );

  if (embedded) return content;

  return (
    <div className="rounded-lg border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]/40">
      {content}
    </div>
  );
}
