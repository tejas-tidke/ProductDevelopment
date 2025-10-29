import React from "react";

// Define the props for the ProjectTabs component
interface ProjectTabsProps {
  activeTab: string;
  setActiveTab: (tab: "list" | "board" | "calendar") => void;
}

// ProjectTabs component for navigating between different project views
const ProjectTabs: React.FC<ProjectTabsProps> = ({ activeTab, setActiveTab }) => {
  // Define the tabs with their IDs and labels
  const tabs = [
    { id: "list", label: "List" },
    { id: "board", label: "Board" },
    { id: "calendar", label: "Calendar" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            // Render a button for each tab
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "list" | "board" | "calendar")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ProjectTabs;