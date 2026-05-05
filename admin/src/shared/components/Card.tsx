import type { PropsWithChildren, ReactNode } from "react";

type CardProps = PropsWithChildren<{
  variant?: "filled" | "outlined" | "elevated";
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  id?: string;
}>;

const variantStyles = {
  filled: "bg-surface-container-lowest shadow-level1",
  outlined: "bg-surface-container-low shadow-level1",
  elevated: "bg-surface-container shadow-level2",
};

export function Card({ variant = "filled", header, footer, children, className, id }: CardProps) {
  return (
    <article id={id} className={`rounded-xl ${variantStyles[variant]} ${className ?? ""}`}>
      {header && <div className="px-5 py-4 bg-surface-container-low/60 rounded-t-xl">{header}</div>}
      {children && <div className="p-5">{children}</div>}
      {footer && <div className="px-5 py-4 bg-surface-container-low rounded-b-xl">{footer}</div>}
    </article>
  );
}
