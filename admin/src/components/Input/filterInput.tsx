import type React from "react";

import { useState, forwardRef } from "react";
// import { cn } from "@/lib/utils";
import { cn } from "../../lib/utils";

interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const FilterInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, icon, className, value, onChange, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.toString().length > 0;

    return (
      <div className="relative">
        <input
          ref={ref}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "peer w-full px-3 py-3 border border-gray-300 rounded-md bg-white transition-all duration-200 ease-in-out",
            "focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none",
            "placeholder-transparent",
            icon && "pl-10",
            className,
          )}
          placeholder={label}
          {...props}
        />

        {icon && (
          <div
            className={cn(
              "absolute left-3 transition-all duration-200 ease-in-out",
              isFocused || hasValue
                ? "top-2 text-red-500"
                : "top-3 text-gray-500",
            )}
          >
            <div className="h-4 w-4">{icon}</div>
          </div>
        )}

        <label
          className={cn(
            "absolute left-3 transition-all duration-200 ease-in-out pointer-events-none",
            "text-gray-500 bg-white px-1",
            icon && "left-10",
            isFocused || hasValue
              ? "-top-2 text-xs text-red-500 font-medium"
              : "top-3 text-base",
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);
