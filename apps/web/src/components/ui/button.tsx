import * as React from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "default" | "secondary" | "destructive" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClassName: Record<ButtonVariant, string> = {
  default: "bg-black text-white hover:bg-black/90",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  destructive: "bg-red-600 text-white hover:bg-red-600/90",
  ghost: "bg-transparent hover:bg-gray-100",
  outline: "border border-gray-200 hover:bg-gray-50",
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white dark:ring-offset-black",
          variantClassName[variant],
          sizeClassName[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";


