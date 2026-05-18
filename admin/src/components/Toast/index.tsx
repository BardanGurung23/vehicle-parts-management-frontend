import { toast } from "sonner";

type ToastVariant = "default" | "success" | "warning" | "error" | "info";
type ToastFunction = (message: string, variant?: ToastVariant) => void;

const Toast: ToastFunction = (message, variant = "default") => {
  if (variant === "success") {
    toast.success(message);
  } else if (variant === "warning") {
    toast.warning(message);
  } else if (variant === "error") {
    toast.error(message);
  } else if (variant === "info") {
    toast.info(message);
  } else {
    toast(message);
  }
};

export default Toast;
