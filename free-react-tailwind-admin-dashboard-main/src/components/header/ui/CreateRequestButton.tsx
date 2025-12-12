import React from "react";

interface CreateRequestButtonProps {
  onClick: () => void;
}

export const CreateRequestButton: React.FC<CreateRequestButtonProps> = ({ onClick }) => {
  return (
    <button 
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors h-11 flex items-center"
      onClick={onClick}
    >
      Create Request
    </button>
  );
};