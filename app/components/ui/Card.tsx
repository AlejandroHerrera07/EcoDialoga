import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-sidebar-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
  accentColor?: "mint" | "teal" | "primary";
}

const accentColors = {
  mint: "border-t-mint-accent",
  teal: "border-t-teal-accent",
  primary: "border-t-primary",
};

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  accentColor = "mint",
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNeutral = change === 0;

  return (
    <div
      className={cn(
        "bg-white rounded-xl p-6 shadow-sm border-t-[6px] flex flex-col gap-2",
        accentColors[accentColor]
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-subtle-text text-sm font-medium uppercase tracking-wider">
          {title}
        </p>
        {icon && (
          <span className="material-symbols-outlined text-teal-accent bg-teal-accent/10 p-1.5 rounded-lg text-[20px]">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-3 mt-2">
        <p className="text-neutral-text text-4xl font-bold tracking-tight">
          {value}
        </p>
        {change !== undefined && (
          <span
            className={cn(
              "flex items-center text-sm font-bold px-2 py-0.5 rounded-full",
              isPositive && "text-success bg-success/10",
              isNeutral && "text-subtle-text bg-slate-100",
              !isPositive && !isNeutral && "text-red-600 bg-red-100"
            )}
          >
            <Icon
              name={isPositive ? "arrow_upward" : isNeutral ? "remove" : "arrow_downward"}
              size="sm"
            />
            {Math.abs(change)}%
          </span>
        )}
      </div>
      {changeLabel && (
        <p className="text-subtle-text text-xs mt-1">{changeLabel}</p>
      )}
    </div>
  );
}
