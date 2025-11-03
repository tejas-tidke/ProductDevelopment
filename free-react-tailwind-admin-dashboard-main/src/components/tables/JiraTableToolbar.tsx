import React from 'react';
import JiraColumnSelector from './JiraColumnSelector';
import { TableColumn } from '../../hooks/useJiraTable';

interface JiraTableToolbarProps {
  columns: TableColumn[];
  onToggleColumn: (columnKey: string) => void;
  onResetToDefault: () => void;
  onApply?: () => void;
  fieldsLoading?: boolean;
}

const JiraTableToolbar: React.FC<JiraTableToolbarProps> = ({ 
  columns,
  onToggleColumn,
  onResetToDefault,
  onApply,
  fieldsLoading
}) => {
  return (
    <div className="mb-4 flex justify-end">
      <JiraColumnSelector 
        columns={columns}
        onToggleColumn={onToggleColumn}
        onResetToDefault={onResetToDefault}
        onApply={onApply}
        fieldsLoading={fieldsLoading}
      />
    </div>
  );
};

export default JiraTableToolbar;