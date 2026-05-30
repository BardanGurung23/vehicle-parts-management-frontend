import { useState, type ReactNode } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
} from "lucide-react";

/**
 * AlertBox — inline page feedback.
 *
 * Tones map to the four semantic colors. Errors use role="alert" with
 * aria-live="assertive"; the others use polite live regions.
 *
 * Documentation: /doc/admin-design-system.md#alerts
 */
type Tone = "error" | "success" | "info" | "warning";

type AlertBoxProps = {
  tone?: Tone;
  title?: string;
  message: ReactNode;
  dismissible?: boolean;
  action?: ReactNode;
};

const toneConfig: Record<
  Tone,
  { icon: typeof Info; container: string; iconClass: string; titleClass: string }
> = {
  error: {
    icon: XCircle,
    container:
      "bg-[var(--danger-50)] border-[var(--danger-100)] text-[var(--danger-700)]",
    iconClass: "text-[var(--danger-500)]",
    titleClass: "text-[var(--danger-700)]",
  },
  success: {
    icon: CheckCircle2,
    container:
      "bg-[var(--success-50)] border-[var(--success-100)] text-[var(--success-700)]",
    iconClass: "text-[var(--success-500)]",
    titleClass: "text-[var(--success-700)]",
  },
  warning: {
    icon: AlertTriangle,
    container:
      "bg-[var(--warning-50)] border-[var(--warning-100)] text-[var(--warning-700)]",
    iconClass: "text-[var(--warning-500)]",
    titleClass: "text-[var(--warning-700)]",
  },
  info: {
    icon: Info,
    container:
      "bg-[var(--info-50)] border-[var(--info-100)] text-[var(--info-700)]",
    iconClass: "text-[var(--info-500)]",
    titleClass: "text-[var(--info-700)]",
  },
};

export function AlertBox({
  tone = "info",
  title,
  message,
  dismissible,
  action,
}: AlertBoxProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const config = toneConfig[tone];
  const Icon = config.icon;
  const role = tone === "error" ? "alert" : "status";

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${config.container} animate-fadeIn`}
      role={role}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <Icon
        className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${config.iconClass}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0 space-y-1">
        {title ? (
          <p className={`font-semibold ${config.titleClass}`}>{title}</p>
        ) : null}
        <div className="leading-5">{message}</div>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
      {dismissible ? (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-0.5 rounded-md hover:bg-black/5 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}
