import { ReactNode } from "react";

interface TertiaryButtonProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const TertiaryButton: React.FC<TertiaryButtonProps> = ({
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

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${sizeClasses[size]} ${className} ${
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

export default TertiaryButton;