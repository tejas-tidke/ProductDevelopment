import React from "react";

interface RequestActionsMenuProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEditOrDelete: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const RequestActionsMenu: React.FC<RequestActionsMenuProps> = ({
  onView,
  onEdit,
  onDelete,
  canEditOrDelete,
  isOpen,
  onClose
}) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-1 w-44 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20" ref={ref}>
      <div className="py-1">
        <button onClick={onView} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">View</button>
        {canEditOrDelete && (
          <>
            <button onClick={onEdit} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Edit</button>
            <button onClick={onDelete} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700">Delete</button>
          </>
        )}
      </div>
    </div>
  );
};