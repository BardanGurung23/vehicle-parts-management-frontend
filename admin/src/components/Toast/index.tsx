import { toast } from "react-toastify";

type toastFunction = (message: string, variant: string) => void;

const Toast: toastFunction = (message, variant) => {
  if (variant === "success") {
    toast.success(message, {
      position: "bottom-right",
    });
  } else if (variant === "warning") {
    toast.warn(message, {
      position: "bottom-right",
    });
  } else if (variant === "error") {
    toast.error(message, {
      position: "bottom-right",
    });
  } else {
    toast(message, {
      position: "bottom-right",
    });
  }
};

export default Toast;
