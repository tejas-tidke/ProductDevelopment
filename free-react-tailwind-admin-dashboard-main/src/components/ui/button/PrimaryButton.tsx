import { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  size = "md",
  startIcon,
  endIcon,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Determine if custom padding is provided in className to override size classes
  const hasCustomPadding = className.includes('p-') || className.includes('px-') || className.includes('py-') || 
                          className.includes('pt-') || className.includes('pb-') ||
                          className.includes('pl-') || className.includes('pr-');
  
  // Determine if custom background colors are provided to override default colors
  const hasCustomBg = className.includes('bg-') && !className.includes('bg-brand-');
  
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg ${!hasCustomBg ? 'bg-indigo-500' : ''} text-white shadow-theme-xs ${!hasCustomBg ? 'hover:bg-indigo-600 disabled:bg-indigo-300' : ''} transition-colors ${!hasCustomPadding ? sizeClasses[size] : ''} ${className} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span>{startIcon}</span>}
      {children}
      {endIcon && <span>{endIcon}</span>}
    </button>
  );
};

export default PrimaryButton;