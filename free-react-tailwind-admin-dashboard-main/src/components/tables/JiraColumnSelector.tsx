import React, { useState } from 'react';
import { TableColumn } from '../../hooks/useJiraTable';

interface JiraColumnSelectorProps {
  columns: TableColumn[];
  onToggleColumn: (columnKey: string) => void;
  onResetToDefault: () => void;
  onApply?: () => void;
  fieldsLoading?: boolean;
}

const JiraColumnSelector: React.FC<JiraColumnSelectorProps> = ({ 
  columns, 
  onToggleColumn, 
  onResetToDefault,
  onApply,
  fieldsLoading = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Handle reset to default
  const handleReset = () => {
    onResetToDefault();
    setIsDropdownOpen(false);
  };
  
  // Handle apply
  const handleApply = () => {
    setIsDropdownOpen(false);
    if (onApply) {
      onApply();
    }
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  // Close dropdown when clicking outside
  const handleClickOutside = () => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    }
  };
  
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex gap-2 relative">
        <div className="relative">
          <button 
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={toggleDropdown}
          >
            Columns
          </button>
          
          {isDropdownOpen && (
            <div 
              className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Select Columns
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {fieldsLoading ? (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      Loading fields...
                    </div>
                  ) : (
                    columns.map(column => (
                      <label 
                        key={column.key} 
                        className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={column.isSelected}
                          onChange={() => onToggleColumn(column.key)}
                          className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {column.header}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                  <button
                    onClick={handleReset}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <button 
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={handleApply}
        >
          Done
        </button>
      </div>
      
      {/* Click outside handler */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleClickOutside}
        />
      )}
    </div>
  );
};

export default JiraColumnSelector;