import React from 'react';
import JiraColumnSelector from './JiraColumnSelector';

interface JiraTableToolbarProps {
  onApply?: () => void;
  onReset?: () => void;
}

const JiraTableToolbar: React.FC<JiraTableToolbarProps> = ({ onApply, onReset }) => {
  return (
    <div className="mb-4">
      <JiraColumnSelector onApply={onApply} onReset={onReset} />
    </div>
  );
};

export default JiraTableToolbar;