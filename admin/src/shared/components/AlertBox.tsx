type AlertBoxProps = {
  tone?: "error" | "success" | "info";
  message: string;
};

export function AlertBox({ tone = "info", message }: AlertBoxProps) {
  return <div className={`alert alert--${tone}`}>{message}</div>;
}