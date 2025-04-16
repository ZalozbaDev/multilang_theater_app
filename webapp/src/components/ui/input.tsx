import React from "react";
import { cn } from "../../lib/utils.ts";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn("px-3 py-2 border rounded-md w-full", className)}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
