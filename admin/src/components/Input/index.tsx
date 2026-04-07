import React, { forwardRef, useState } from "react";
import { FieldError } from "react-hook-form";
import "./input.css";
import useTranslation from "@/locale/useTranslation";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode;
  error?: string | FieldError;
  className?: string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  isRequired?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className,
      leftSection,
      rightSection,
      type = "text",
      isRequired,
      ...rest
    },
    ref,
  ) => {
    const translate = useTranslation();
    const [showPasswordVisibility, setShowPasswordVisibility] =
      useState<boolean>(false);

    const handlePasswordVisibility = () => {
      setShowPasswordVisibility(!showPasswordVisibility);
    };

    return (
      <div className={`input-container ${className || ""}`}>
        {label && (
          <label className="input-label">
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
        )}
        <div
          className={`input-wrapper bg-red-200 ${
            type === "checkbox" ? "input-checkbox-wrapper" : ""
          } ${rest.disabled === "true" ? "opacity-90 cursor-not-allowed" : "opacity-100"}`}
        >
          {leftSection && (
            <div className="input-left-section">{leftSection}</div>
          )}
          <input
            ref={ref}
            type={type === "password" && showPasswordVisibility ? "text" : type}
            className={`input-field ${error ? "input-error-field" : ""}  ${rest.disabled === "true" ? "cursor-not-allowed" : "cursor-text"}`}
            {...rest}
          />
          {type === "password" && (
            <div
              className="input-right-section cursor-pointer"
              onClick={handlePasswordVisibility}
            >
              {showPasswordVisibility ? "🙈" : "👁️"}
            </div>
          )}
          {rightSection && (
            <div className="input-right-section">{rightSection}</div>
          )}
        </div>
        {error && (
          <span className="input-error">
            {typeof error === "string" ? error : error.message}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input"; // Needed for forwardRef components

export default Input;
