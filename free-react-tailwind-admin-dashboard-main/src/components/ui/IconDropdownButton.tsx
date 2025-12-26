import React, { ReactNode, ButtonHTMLAttributes, Ref } from "react";

export interface IconDropdownButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode; // The icon or content inside the button
  onClick: () => void;
  className?: string; // Additional className for custom styling
  badgeCount?: number; // Optional badge count (for notifications)
  ariaLabel: string; // Accessibility label
  hasBadge?: boolean; // Whether to show badge positioning
  ref?: Ref<HTMLButtonElement>;
}

export const IconDropdownButton: React.ForwardRefExoticComponent<React.PropsWithoutRef<IconDropdownButtonProps> & React.RefAttributes<HTMLButtonElement>> = 
React.forwardRef<HTMLButtonElement, IconDropdownButtonProps>(({
  children,
  onClick,
  className = "",
  badgeCount,
  ariaLabel,
  hasBadge = false,
  ...props
}, ref) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white ${className}`}
      aria-label={ariaLabel}
      ref={ref}
      {...props}
    >
      {children}
      {hasBadge && badgeCount !== undefined && badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
          {badgeCount}
        </span>
      )}
    </button>
  );
});

IconDropdownButton.displayName = 'IconDropdownButton';