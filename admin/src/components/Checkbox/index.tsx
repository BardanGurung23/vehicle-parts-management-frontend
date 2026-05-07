import React, { forwardRef } from "react";
import { FieldError } from "react-hook-form";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | FieldError;
  className?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, ...rest }, ref) => {
    return (
      <div className={`text-on-surface ${className || ""}`}>
        <div className="flex items-center gap-[0.5rem]">
          <input
            ref={ref}
            type="checkbox"
            className={`h-4 w-4 border border-outline-variant rounded-sm accent-primary focus:ring-primary ${
              error ? "border-error" : ""
            }`}
            {...rest}
          />
          {label && <label className="text-on-surface">{label}</label>}
        </div>
        {error && (
          <span className="text-error text-sm">
            {typeof error === "string" ? error : error.message}
          </span>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
