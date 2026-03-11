import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg";
  showStatus?: boolean;
  status?: "online" | "offline" | "away";
  initials?: string;
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const statusSizeClasses = {
  xs: "w-2 h-2",
  sm: "w-2.5 h-2.5",
  md: "w-3 h-3",
  lg: "w-3.5 h-3.5",
};

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  away: "bg-yellow-500",
};

export function Avatar({
  src,
  alt,
  size = "md",
  showStatus = false,
  status = "online",
  initials,
  className,
}: AvatarProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size === "lg" ? 48 : size === "md" ? 40 : size === "sm" ? 32 : 24}
          height={size === "lg" ? 48 : size === "md" ? 40 : size === "sm" ? 32 : 24}
          className={cn(
            "rounded-full object-cover ring-2 ring-white dark:ring-gray-800",
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-full bg-teal-accent flex items-center justify-center text-white font-bold",
            sizeClasses[size],
            size === "xs" && "text-[8px]",
            size === "sm" && "text-[10px]",
            size === "md" && "text-xs",
            size === "lg" && "text-sm"
          )}
        >
          {initials || alt.charAt(0).toUpperCase()}
        </div>
      )}
      {showStatus && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-800",
            statusSizeClasses[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ src?: string; alt: string }>;
  max?: number;
  size?: "xs" | "sm" | "md";
}

export function AvatarGroup({ avatars, max = 5, size = "xs" }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className="flex -space-x-2 overflow-hidden">
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border-2 border-white dark:border-gray-800",
            sizeClasses[size],
            "text-[10px]"
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
