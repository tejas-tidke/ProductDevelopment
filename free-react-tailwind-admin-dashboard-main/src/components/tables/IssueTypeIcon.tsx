import React from 'react';

interface IssueTypeIconProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
}

const IssueTypeIcon: React.FC<IssueTypeIconProps> = ({ type, size = 'md' }) => {
  // Define icon sizes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  // Define colors and icons for different issue types (matching Jira's color scheme)
  const issueTypeConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
    'Task': {
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z'
    },
    'Bug': {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z'
    },
    'Story': {
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
    },
    'Epic': {
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-8 8z'
    },
    'Sub-task': {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'
    },
    'Subtask': {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'
    },
    'default': {
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
    }
  };
  
  // Get configuration for the issue type or use default
  const config = issueTypeConfig[type] || issueTypeConfig['default'];
  
  return (
    <div className="flex items-center">
      <span className={`${config.bgColor} ${config.color} rounded flex items-center justify-center ${sizeClasses[size]}`}>
        <svg 
          className={`${sizeClasses[size]}`} 
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d={config.icon} />
        </svg>
      </span>
      <span className="ml-2 text-sm">{type}</span>
    </div>
  );
};

export default IssueTypeIcon;