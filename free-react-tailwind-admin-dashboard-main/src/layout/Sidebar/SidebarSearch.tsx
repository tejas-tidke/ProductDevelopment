import React, { useState } from "react";
import { useNavigate } from "react-router";

interface SidebarSearchProps {
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
}

const SidebarSearch: React.FC<SidebarSearchProps> = ({ 
  isExpanded, 
  isHovered, 
  isMobileOpen 
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchTerm.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      }
    }
  };

  return (
    <div className="menu-item group menu-item-inactive">
      <div className="flex items-center flex-1">
        <div className="menu-item-icon-size menu-item-icon-inactive">
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="flex-1 ml-3">
            <input
              type="text"
              placeholder="Evaluate a Tool"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarSearch;