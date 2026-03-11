"use client";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <label className="flex flex-col gap-2">
        {label && (
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
            {label}
          </span>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Icon name={icon} size="md" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-14 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none",
              icon ? "pl-12 pr-4" : "px-4",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
        {helperText && !error && (
          <span className="text-xs text-gray-500 ml-1">{helperText}</span>
        )}
      </label>
    );
  }
);

Input.displayName = "Input";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, ...props }, ref) => {
    return (
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon name="search" className="text-gray-400" size="md" />
        </div>
        <input
          ref={ref}
          type="text"
          className={cn(
            "block w-full rounded-xl border-0 py-3 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
