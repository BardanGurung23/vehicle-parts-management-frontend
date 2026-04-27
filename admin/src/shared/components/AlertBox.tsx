type AlertBoxProps = {
  tone?: "error" | "success" | "info";
  message: string;
};

export function AlertBox({ tone = "info", message }: AlertBoxProps) {
  const role = tone === "error" ? "alert" : "status";

  return (
    <div className={`alert alert--${tone}`} role={role} aria-live={tone === "error" ? "assertive" : "polite"}>
      {message}
    </div>
  );
}