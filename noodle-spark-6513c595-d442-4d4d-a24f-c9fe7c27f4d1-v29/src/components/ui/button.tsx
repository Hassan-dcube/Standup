/**
 * Button Component
 * 
 * This is an example Button component that demonstrates how to use Radix UI Slot
 * along with styling utilities. This file is commented out and serves as a reference
 * for how to build components using the available libraries.
 * 
 * Libraries demonstrated:
 * - @radix-ui/react-slot
 * - clsx
 */

/*
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "primary" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-primary text-white hover:bg-primary-hover": variant === "primary",
            "bg-destructive text-white hover:bg-destructive/90": variant === "destructive",
            "bg-transparent border border-gray-300 hover:bg-gray-100": variant === "outline",
            "bg-secondary text-white hover:bg-secondary-hover": variant === "secondary",
            "hover:bg-gray-100": variant === "ghost",
            "underline-offset-4 hover:underline text-primary": variant === "link",
          },
          {
            "h-10 py-2 px-4 text-sm": size === "default",
            "h-8 px-3 text-xs rounded": size === "sm",
            "h-12 px-6 text-base rounded-md": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
*/
