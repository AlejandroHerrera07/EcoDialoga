import { cn } from "@/lib/utils";

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "text-[16px]",
  md: "text-[20px]",
  lg: "text-[24px]",
  xl: "text-[32px]",
};

export function Icon({
  name,
  className,
  filled = false,
  size = "lg",
}: IconProps) {
  return (
    <span
      className={cn(
        "material-symbols-outlined",
        filled && "filled",
        sizeClasses[size],
        className
      )}
    >
      {name}
    </span>
  );
}
