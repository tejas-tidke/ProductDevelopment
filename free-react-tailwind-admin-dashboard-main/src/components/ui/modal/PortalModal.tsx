import { useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full'
};

const PortalModal: React.FC<PortalModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  className = "",
  showCloseButton = true,
  size = '2xl'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      {/* Frosted / blurred backdrop similar to provided image */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        style={{
          // translucent overlay color + frosted blur
          background:
            'linear-gradient(180deg, rgba(232,236,243,0.55), rgba(220,224,233,0.55))',
          backdropFilter: 'blur(30px) saturate(110%)',
          WebkitBackdropFilter: 'blur(30px) saturate(110%)',
        }}
      />

      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden>
          {'\u200B'}
        </span>

        <div
          ref={modalRef}
          className={`${sizeClasses[size]} inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:w-full dark:bg-gray-800 z-[10000] relative ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? undefined : "modal-title"}
          onClick={(e) => e.stopPropagation()} // prevent clicks inside modal from closing backdrop
          tabIndex={-1}
        >
          {/* Close button (round) */}
          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white dark:bg-gray-700 dark:hover:bg-gray-600"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {title && (
            <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
              <h5 id="modal-title" className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {title}
              </h5>
            </div>
          )}

          <div className={`px-6 py-4 ${title ? '' : 'pt-6'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PortalModal;