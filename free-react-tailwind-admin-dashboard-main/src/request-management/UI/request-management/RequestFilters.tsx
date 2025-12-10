import React from "react";
import { JiraIssueType } from "../../business-logic/request-management";

interface RequestFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedIssueType: string;
  setSelectedIssueType: (type: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  issueTypes: JiraIssueType[];
  statuses: { id: string; name: string }[];
}

export const RequestFilters: React.FC<RequestFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedIssueType,
  setSelectedIssueType,
  selectedStatus,
  setSelectedStatus,
  issueTypes,
  statuses
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Requests</h1>
      <div className="flex space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search requests..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="relative">
          <label htmlFor="issueTypeFilter" className="sr-only">Filter by Issue Type</label>
          <select
            id="issueTypeFilter"
            className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={selectedIssueType}
            onChange={(e) => setSelectedIssueType(e.target.value)}
          >
            <option value="">All Types</option>
            {issueTypes.map(type => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
          <select
            id="statusFilter"
            className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status.id} value={status.name}>{status.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};