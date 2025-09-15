import * as React from "react";
import { cn } from "../../lib/utils";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    const ariaProps = orientation === "vertical" ? { "aria-orientation": "vertical" as const } : {};
    return (
      <div
        ref={ref}
        role="separator"
        {...ariaProps}
        className={cn(
          "bg-gray-200 dark:bg-gray-800",
          orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
          className,
        )}
        {...props}
      />
    );
  },
);

Separator.displayName = "Separator";


