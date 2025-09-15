/**
 * Utility functions for component development
 * 
 * This file contains utility functions that demonstrate how to use
 * libraries like clsx for conditional class naming and other common patterns.
 */

// Example of how to use clsx for conditional class names
// import { clsx, type ClassValue } from "clsx";

/**
 * Combines multiple class names using clsx and filters out falsy values
 * 
 * @example
 * // Returns "btn btn-primary" (when isActive is true)
 * cn("btn", { "btn-primary": isActive, "btn-secondary": !isActive });
 * 
 * // Returns "flex items-center gap-2" 
 * cn("flex", "items-center", "gap-2");
 */
export function cn(...inputs: any[]) {
  // Uncomment when using clsx:
  // return clsx(inputs);
  
  // This is a simplified version just for demonstration
  return inputs
    .flat()
    .filter(Boolean)
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object") {
        return Object.entries(item)
          .filter(([_key, value]) => Boolean(value))
          .map(([key]) => key);
      }
      return null;
    })
    .flat()
    .filter(Boolean)
    .join(" ");
}

/**
 * Animation variants for framer-motion
 * 
 * @example
 * <motion.div
 *   initial="hidden"
 *   animate="visible"
 *   variants={fadeIn}
 * >
 *   Content
 * </motion.div>
 */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

export const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

/**
 * Example: Creating a button component with Radix Slot and styling utilities
 * 
 * @example
 * // Usage:
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 */
/*
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

// Example button variants using class-variance-authority
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
*/

/**
 * Example: Function for building RESTful API requests with type safety
 * 
 * @example
 * const { data } = await fetchApi('/users', { method: 'GET' });
 */
export async function fetchApi(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}
