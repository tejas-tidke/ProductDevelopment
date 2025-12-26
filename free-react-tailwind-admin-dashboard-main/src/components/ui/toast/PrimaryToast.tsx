import React from "react";

interface PrimaryToastProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export default function PrimaryToast({ message, onClose, type = 'success' }: PrimaryToastProps) {
  const getToastStyles = () => {
    switch(type) {
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-blue-500 bg-blue-50';
      case 'success':
      default:
        return 'border-green-500 bg-green-50';
    }
  };

  const getIcon = () => {
    switch(type) {
      case 'error':
        return (
          <svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.15 3.34999C14.925 3.12499 14.575 3.12499 14.35 3.34999L5.85 11.6L1.65 7.47499C1.425 7.24999 1.075 7.27499 0.850003 7.47499C0.625003 7.69999 0.650003 8.04999 0.850003 8.27499L5.275 12.575C5.425 12.725 5.625 12.8 5.85 12.8C6.075 12.8 6.25 12.725 6.425 12.575L15.15 4.09999C15.375 3.92499 15.375 3.57499 15.15 3.34999Z"
              fill="#EF4444"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1ZM8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11C8.55228 11 9 11.4477 9 12C9 12.5523 8.55228 13 8 13ZM8.70711 9.70711L8.70711 5C8.70711 4.58579 8.37132 4.25 7.95711 4.25C7.54289 4.25 7.20711 4.58579 7.20711 5L7.20711 9.70711L6.20711 8.70711C5.81658 8.31658 5.18342 8.31658 4.79289 8.70711C4.40237 9.09763 4.40237 9.73079 4.79289 10.1213L7.29289 12.6213C7.68342 13.0118 8.31658 13.0118 8.70711 12.6213L11.2071 10.1213C11.5976 9.73079 11.5976 9.09763 11.2071 8.70711C10.8166 8.31658 10.1834 8.31658 9.79289 8.70711L8.70711 9.70711Z"
              fill="#F59E0B"
            />
          </svg>
        );
      case 'info':
        return (
          <svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1ZM8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11C8.55228 11 9 11.4477 9 12C9 12.5523 8.55228 13 8 13ZM8 10C7.44772 10 7 9.55228 7 9L7 6C7 5.44772 7.44772 5 8 5C8.55228 5 9 5.44772 9 6L9 9C9 9.55228 8.55228 10 8 10Z"
              fill="#3B82F6"
            />
          </svg>
        );
      case 'success':
      default:
        return (
          <svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.15 3.34999C14.925 3.12499 14.575 3.12499 14.35 3.34999L5.85 11.6L1.65 7.47499C1.425 7.24999 1.075 7.27499 0.850003 7.47499C0.625003 7.69999 0.650003 8.04999 0.850003 8.27499L5.275 12.575C5.425 12.725 5.625 12.8 5.85 12.8C6.075 12.8 6.25 12.725 6.425 12.575L15.15 4.09999C15.375 3.92499 15.375 3.57499 15.15 3.34999Z"
              fill="white"
            />
          </svg>
        );
    }
  };

  const getBackgroundClass = () => {
    switch(type) {
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      case 'success':
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[100000]">
      <div className={`relative flex w-full max-w-[460px] items-center rounded-lg border px-5 py-[18px] ${getToastStyles()}`}>
        <span className={`mr-4 flex h-[30px] w-full max-w-[30px] items-center justify-center rounded-full ${getBackgroundClass()}`}>
          {getIcon()}
        </span>
        <p className="text-base font-semibold sm:text-lg">
          {message}
        </p>
        <button 
          onClick={onClose}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="fill-current"
          >
            <g clipPath="url(#clip0_1088_26057)">
              <path d="M8.79999 7.99999L14.9 1.89999C15.125 1.67499 15.125 1.32499 14.9 1.09999C14.675 0.874994 14.325 0.874994 14.1 1.09999L7.99999 7.19999L1.89999 1.09999C1.67499 0.874994 1.32499 0.874994 1.09999 1.09999C0.874994 1.32499 0.874994 1.67499 1.09999 1.89999L7.19999 7.99999L1.09999 14.1C0.874994 14.325 0.874994 14.675 1.09999 14.9C1.19999 15 1.34999 15.075 1.49999 15.075C1.64999 15.075 1.79999 15.025 1.89999 14.9L7.99999 8.79999L14.1 14.9C14.2 15 14.35 15.075 14.5 15.075C14.65 15.075 14.8 15.025 14.9 14.9C15.125 14.675 15.125 14.325 14.9 14.1L8.79999 7.99999Z" />
            </g>
            <defs>
              <clipPath id="clip0_1088_26057">
                <rect width={16} height={16} fill="white" />
              </clipPath>
            </defs>
          </svg>
        </button>
      </div>
    </div>
  );
}