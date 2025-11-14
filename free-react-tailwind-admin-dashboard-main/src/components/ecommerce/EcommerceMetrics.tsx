import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  BoxIconLine, 
  GroupIcon, 
  TrashBinIcon 
} from "../../icons";

import Badge from "../ui/badge/Badge";
import { useState } from "react";

export default function EcommerceMetrics() {
  // State for managing filter input and saved filters
  const [filterText, setFilterText] = useState<string>("");
  const [savedFilters, setSavedFilters] = useState<string[]>([]);

  // Function to handle saving a new filter
  const handleSaveFilter = () => {
    const trimmed = filterText.trim();
    if (trimmed && !savedFilters.includes(trimmed)) {
      setSavedFilters((prevFilters) => [...prevFilters, trimmed]);
      setFilterText(""); // Clear input after saving
    }
  };

  // Function to handle deleting a filter
  const handleDeleteFilter = (index: number) => {
    setSavedFilters((prevFilters) => prevFilters.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h3 className="font-bold text-gray-800 dark:text-white/90">Jira Filters</h3>

        {/* Filter Input + Save Button */}
        <div className="mt-5 flex gap-4 items-center">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="Enter filter name"
          />
          <button
            onClick={handleSaveFilter}
            className="bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition"
          >
            Save Filter
          </button>
        </div>

        {/* Saved Filters List */}
        <div className="mt-5">
          <h4 className="font-semibold text-gray-700 dark:text-white/90">Saved Filters</h4>

          <ul className="mt-3 space-y-2">
            {savedFilters.length > 0 ? (
              savedFilters.map((filter, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/40 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <span className="text-gray-700 dark:text-gray-300">{filter}</span>
                  <button
                    onClick={() => handleDeleteFilter(index)}
                    className="text-red-500 hover:text-red-600 transition"
                    title="Delete filter"
                  >
                    <TrashBinIcon className="w-5 h-5" />
                  </button>
                </li>
              ))
            ) : (
              <li className="text-gray-400 dark:text-gray-500">No filters saved yet</li>
            )}
          </ul>
        </div>
      </div>

      
        </div>
     
  );
}
