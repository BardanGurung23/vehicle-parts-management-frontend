type BadgeProps = {
  variant?: "success" | "warning" | "danger" | "neutral" | "info";
  children: string;
};

const variantStyles = {
  success: "bg-success-container text-success-on-container",
  warning: "bg-warning-container text-warning-on-container",
  danger: "bg-error-container text-error-on-container",
  neutral: "bg-surface-container-highest text-on-surface-variant",
  info: "bg-tertiary-container text-on-tertiary-container",
};

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-0.5 text-label-small rounded-full ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}
