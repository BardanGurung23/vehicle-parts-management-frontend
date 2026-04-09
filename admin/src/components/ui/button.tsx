import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-65 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_8px_rgba(0,0,0,0.1)] border-none",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:opacity-90 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_8px_rgba(0,0,0,0.1)] border-none",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]",
        secondary:
          "bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border-translucent)] shadow-sm hover:opacity-80",
        ghost: "hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]",
        link: "text-[var(--accent)] font-semibold underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[2.7rem] px-[1.25rem] py-2",
        sm: "min-h-8 px-3 text-xs",
        lg: "min-h-11 px-8 text-base",
        icon: "h-10 w-10 min-h-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
