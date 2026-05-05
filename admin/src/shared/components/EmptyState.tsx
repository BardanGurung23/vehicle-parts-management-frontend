import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl text-center bg-surface-container-lowest shadow-level1">
      <Icon className="w-10 h-10 text-on-surface-variant mb-3" aria-hidden="true" />
      <h3 className="text-title-medium text-on-surface mb-1">{title}</h3>
      {description && <p className="text-body-medium text-on-surface-variant max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
