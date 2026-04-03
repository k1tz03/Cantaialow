"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        className={cn(
          "peer h-5 w-5 shrink-0 rounded-sm border-2 border-border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          checked && "border-accent bg-accent",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        <input ref={ref} type="checkbox" className="sr-only" {...props} />
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
