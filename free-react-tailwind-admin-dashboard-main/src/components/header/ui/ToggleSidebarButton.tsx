import React from "react";

interface ToggleSidebarButtonProps {
  isMobileOpen: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

export const ToggleSidebarButton: React.FC<ToggleSidebarButtonProps> = ({
  isMobileOpen,
  isExpanded,
  onClick,
}) => {
  // For mobile, show X when open, hamburger when closed
  if (window.innerWidth < 1024) {
    return (
      <button
        onClick={onClick}
        aria-label="Toggle Sidebar"
        className="flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11
                   rounded-lg bg-white dark:bg-gray-900
                   border border-gray-200 dark:border-gray-800
                   text-gray-500 dark:text-gray-400
                   hover:bg-gray-100 dark:hover:bg-gray-800
                   transition-all duration-200"
      >
        {isMobileOpen ? (
          /* ❌ Close (X) Icon */
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          /* ☰ Hamburger Icon */
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M4 6H20"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M4 12H20"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M4 18H20"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    );
  }

  // For desktop, show hamburger when collapsed, and a different icon when expanded
  return (
    <button
      onClick={onClick}
      aria-label="Toggle Sidebar"
      className="flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11
                 rounded-lg bg-white dark:bg-gray-900
                 border border-gray-200 dark:border-gray-800
                 text-gray-500 dark:text-gray-400
                 hover:bg-gray-100 dark:hover:bg-gray-800
                 transition-all duration-200"
    >
      {isExpanded ? (
        /* Collapsed sidebar icon (three horizontal lines closer together) */
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 7H18"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M6 12H18"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M6 17H18"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        /* Expanded sidebar icon (standard hamburger) */
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M4 6H20"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M4 12H20"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M4 18H20"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
};