"use client";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "teal";
  size?: "sm" | "md" | "lg";
  icon?: string;
  iconPosition?: "left" | "right";
  children?: React.ReactNode;
}

const variantClasses = {
  primary:
    "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30",
  secondary:
    "bg-white dark:bg-sidebar-dark text-neutral-text dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
  ghost:
    "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
  danger:
    "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20",
  teal:
    "bg-teal-accent hover:bg-[#3d8299] text-white shadow-sm hover:shadow-lg hover:shadow-teal-accent/20",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-lg transition-all active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {icon && iconPosition === "left" && (
          <Icon name={icon} size={size === "sm" ? "sm" : "md"} />
        )}
        {children}
        {icon && iconPosition === "right" && (
          <Icon name={icon} size={size === "sm" ? "sm" : "md"} />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
