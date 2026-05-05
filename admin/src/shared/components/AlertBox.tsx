import { useState } from "react";
import { CheckCircle, AlertTriangle, Info, XCircle, X } from "lucide-react";

type AlertBoxProps = {
  tone?: "error" | "success" | "info" | "warning";
  message: string;
  dismissible?: boolean;
};

const toneConfig = {
  error: { icon: XCircle, class: "bg-error-container text-error-on-container border-error/20" },
  success: { icon: CheckCircle, class: "bg-success-container text-success-on-container border-success/20" },
  warning: { icon: AlertTriangle, class: "bg-warning-container text-warning-on-container border-warning/20" },
  info: { icon: Info, class: "bg-tertiary-container text-on-tertiary-container border-tertiary/20" },
};

export function AlertBox({ tone = "info", message, dismissible }: AlertBoxProps) {
  const [dismissed, setDismissed] = useState(false);
  const config = toneConfig[tone];
  const Icon = config.icon;
  const role = tone === "error" ? "alert" : "status";

  if (dismissed) return null;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${config.class} animate-slideUp`}
      role={role}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <p className="flex-1 text-body-medium">{message}</p>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-0.5 rounded-full hover:bg-black/20 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
