import React, { useState } from "react";

interface CustomField {
  id: string;
  name: string;
}

interface CustomFilterDropdownProps {
  customFields: CustomField[];
  onSortChange: (fieldId: string, direction: 'asc' | 'desc') => void;
  onAddFilter: (fieldId: string) => void;
}

export const CustomFilterDropdown: React.FC<CustomFilterDropdownProps> = ({
  customFields,
  onSortChange,
  onAddFilter
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSortField, setSelectedSortField] = useState<string>('');

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleSortChange = (fieldId: string) => {
    setSelectedSortField(fieldId);
    onSortChange(fieldId, sortDirection);
  };

  const handleSortDirectionChange = (direction: 'asc' | 'desc') => {
    setSortDirection(direction);
    if (selectedSortField) {
      onSortChange(selectedSortField, direction);
    }
  };

  const handleAddFilter = (fieldId: string) => {
    onAddFilter(fieldId);
    closeDropdown();
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
        aria-label="Custom filters"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
        </svg>
        Filters
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Custom Filters</h3>
              <button
                onClick={closeDropdown}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Sorting Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort by</h4>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedSortField}
                  onChange={(e) => handleSortChange(e.target.value)}
                  aria-label="Sort by field"
                >
                  <option value="">Select field</option>
                  {customFields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
                <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
                  <button
                    className={`px-3 py-2 text-sm font-medium ${sortDirection === 'asc' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-white'}`}
                    onClick={() => handleSortDirectionChange('asc')}
                    aria-label="Sort ascending"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                    </svg>
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium ${sortDirection === 'desc' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-white'}`}
                    onClick={() => handleSortDirectionChange('desc')}
                    aria-label="Sort descending"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* More Filters Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">More filters</h4>
              <div className="max-h-40 overflow-y-auto">
                <ul className="space-y-1">
                  {customFields.map(field => (
                    <li key={field.id}>
                      <button
                        onClick={() => handleAddFilter(field.id)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-700"
                        aria-label={`Add filter for ${field.name}`}
                      >
                        {field.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};