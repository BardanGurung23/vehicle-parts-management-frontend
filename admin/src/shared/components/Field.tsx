import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";

type FormControlProps = {
  id?: string;
  className?: string;
  type?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

const formControlTypes = new Set(["input", "select", "textarea"]);

function isFormControlElement(child: ReactNode): child is ReactElement<FormControlProps> {
  return isValidElement(child) && typeof child.type === "string" && formControlTypes.has(child.type);
}

function mergeDescribedBy(existing: string | undefined, next: string | undefined) {
  return [existing, next].filter(Boolean).join(" ") || undefined;
}

function mergeClassName(existing: string | undefined, next: string) {
  if (!existing) {
    return next;
  }

  return existing.includes(next) ? existing : `${existing} ${next}`;
}

type FieldProps = PropsWithChildren<{
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
}>;

export function Field({ label, error, hint, required, htmlFor, children }: FieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  let control = children;

  if (isFormControlElement(children)) {
    const isPasswordInput = children.type === "input" && children.props.type === "password";
    const enhancedChild = cloneElement(children, {
      id: children.props.id ?? fieldId,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": mergeDescribedBy(children.props["aria-describedby"], describedBy),
      ...(isPasswordInput
        ? {
            type: isPasswordVisible ? "text" : "password",
            className: mergeClassName(children.props.className, "pr-11"),
          }
        : null),
    });

    control = isPasswordInput ? (
      <div className="relative">
        {enhancedChild}
        <button
          type="button"
          className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:text-on-surface"
          onClick={() => setIsPasswordVisible((current) => !current)}
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        >
          {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    ) : (
      enhancedChild
    );
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-on-surface-variant">
        {label}
        {required && <span className="ml-0.5 text-error" aria-hidden="true">*</span>}
      </label>
      <div>{control}</div>
      {hint && !error && <p id={hintId} className="text-xs text-on-surface-variant">{hint}</p>}
      {error && <p id={errorId} className="text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}
