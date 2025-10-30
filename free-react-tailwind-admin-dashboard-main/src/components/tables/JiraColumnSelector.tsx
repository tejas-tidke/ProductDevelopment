import React, { useState } from 'react';
import Select, { OptionType } from '@atlaskit/select';
import Button from '@atlaskit/button';
import { useJiraTable } from '../../hooks/useJiraTable';

interface JiraColumnSelectorProps {
  onApply?: () => void;
  onReset?: () => void;
}

const JiraColumnSelector: React.FC<JiraColumnSelectorProps> = ({ onApply, onReset }) => {
  const {
    columns,
    toggleColumn,
    selectAllColumns,
    deselectAllColumns,
    resetToDefaultColumns
  } = useJiraTable();
  
  // Local state for selected options in the select component
  const [selectedOptions, setSelectedOptions] = useState<OptionType[]>(
    columns
      .filter(col => col.isSelected)
      .map(col => ({
        label: col.header,
        value: col.key
      }))
  );
  
  // All available options
  const allOptions: OptionType[] = columns.map(col => ({
    label: col.header,
    value: col.key
  }));
  
  // Handle selection change
  const handleChange = (selected: readonly OptionType[]) => {
    setSelectedOptions([...selected]);
    
    // Update column visibility based on selection
    columns.forEach(column => {
      const isSelected = selected.some(option => option.value === column.key);
      if (column.isSelected !== isSelected) {
        toggleColumn(column.key);
      }
    });
  };
  
  // Handle select all
  const handleSelectAll = () => {
    setSelectedOptions(allOptions);
    selectAllColumns();
  };
  
  // Handle deselect all
  const handleDeselectAll = () => {
    setSelectedOptions([]);
    deselectAllColumns();
  };
  
  // Handle reset to default
  const handleReset = () => {
    const defaultSelected = allOptions.filter(option => 
      columns.find(col => col.key === option.value)?.isSelected
    );
    setSelectedOptions(defaultSelected);
    resetToDefaultColumns();
    onReset?.();
  };
  
  // Handle apply
  const handleApply = () => {
    onApply?.();
  };
  
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex-grow">
        <Select
          inputId="column-selector"
          placeholder="Select columns to display..."
          options={allOptions}
          value={selectedOptions}
          onChange={handleChange}
          isMulti
          isSearchable={false}
        />
      </div>
      <div className="flex gap-2">
        <Button 
          appearance="subtle" 
          onClick={handleSelectAll}
        >
          Select All
        </Button>
        <Button 
          appearance="subtle" 
          onClick={handleDeselectAll}
        >
          Deselect All
        </Button>
        <Button 
          appearance="subtle" 
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button 
          appearance="primary" 
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

export default JiraColumnSelector;