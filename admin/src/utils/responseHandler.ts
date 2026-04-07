import { FieldValues, UseFormSetError } from "react-hook-form";
import Toast from "../components/Toast";

interface HandleResponseParams {
  res: any;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
}

interface HandleErrorParams {
  error: any;
  setError?: UseFormSetError<any>;
  defaultMessage?: string;
}

export const handleResponse = ({
  res,
  successMessage = "Successful",
  errorMessage = "Something Went Wrong",
  onSuccess,
}: HandleResponseParams) => {
  if (res?.success) {
    Toast(res?.msg || successMessage, "success");
    if (onSuccess) {
      onSuccess();
    }
  } else {
    Toast(res?.msg || errorMessage, "error");
  }
};

export const handleError = ({
  error,
  setError,
  defaultMessage = "Something Went Wrong",
}: HandleErrorParams) => {
  if (setError && error?.data?.errors) {
    Object.keys(error?.data?.errors).forEach((field) => {
      const errorMessage = error?.data?.errors[field];

      setError(field, {
        type: "server",
        message: errorMessage,
      });
    });
  }
  if (error?.data?.msg) {
    Toast(error?.data?.msg || defaultMessage, "error");
  } else {
    Toast(error?.data?.message || defaultMessage, "error");
  }
};
