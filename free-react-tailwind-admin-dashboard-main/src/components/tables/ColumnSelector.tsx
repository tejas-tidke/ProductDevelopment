import React, { useState, useEffect, useRef } from 'react';
import Button from '@atlaskit/button';
import Checkbox from '@atlaskit/checkbox';
import { jiraService } from '../../services/jiraService';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface Column {
  key: string;
  title: string;
  isSortable: boolean;
  isSelected: boolean;
}

interface JiraField {
  id: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
}

interface ColumnSelectorProps {
  columns: Column[];
  onColumnToggle: (columnKey: string) => void;
  projectKey: string;
  onColumnReorder?: (newOrder: Column[]) => void;
}

// Draggable column item component for selected columns
const DraggableSelectedColumn: React.FC<{
  column: Column;
  index: number;
  onColumnToggle: (columnKey: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}> = ({ column, index, onColumnToggle, onMove }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'selectedColumn',
    item: { index, column },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'selectedColumn',
    hover(item: { index: number; column: Column }, monitor) {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = (clientOffset as { x: number; y: number }).y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      onMove(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  return (
    <div 
      ref={ref}
      className={`flex items-center px-4 py-2 hover:bg-blue-100 cursor-pointer transition-colors duration-150 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center h-5">
        <Checkbox
          isChecked={true}
          onChange={() => onColumnToggle(column.key)}
          label=""
        />
      </div>
      <div className="ml-3 text-sm font-medium text-gray-900">
        {column.title}
      </div>
    </div>
  );
};

const ColumnSelectorContent: React.FC<ColumnSelectorProps> = ({ columns, onColumnToggle, projectKey, onColumnReorder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [jiraFields, setJiraFields] = useState<JiraField[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch Jira fields when component mounts or projectKey changes
  useEffect(() => {
    const fetchJiraFields = async () => {
      if (!projectKey) return;
      
      try {
        setLoading(true);
        const fields: JiraField[] = await jiraService.getFields();
        setJiraFields(fields);
      } catch (error) {
        console.error('Error fetching Jira fields:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJiraFields();
  }, [projectKey]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle column move (reordering)
  const handleMoveColumn = (dragIndex: number, hoverIndex: number) => {
    if (!onColumnReorder) return;
    
    const selectedCols = columns.filter(col => col.isSelected);
    const newOrder = [...selectedCols];
    
    // Remove the dragged item
    const draggedItem = newOrder[dragIndex];
    newOrder.splice(dragIndex, 1);
    
    // Insert the dragged item at the new position
    newOrder.splice(hoverIndex, 0, draggedItem);
    
    // Create a new array with all columns, preserving the order of selected columns
    const reorderedColumns = columns.map(col => {
      const newIndex = newOrder.findIndex(newCol => newCol.key === col.key);
      return newIndex !== -1 ? newOrder[newIndex] : col;
    });
    
    onColumnReorder(reorderedColumns);
  };

  const handleReset = () => {
    // Reset to default columns
    columns.forEach(column => {
      const isDefaultColumn = (
        column.key === 'key' || 
        column.key === 'issuetype' || 
        column.key === 'summary' || 
        column.key === 'status' || 
        column.key === 'assignee' || 
        column.key === 'reporter' || 
        column.key === 'priority'
      );
      
      if (isDefaultColumn && !column.isSelected) {
        onColumnToggle(column.key);
      } else if (!isDefaultColumn && column.isSelected) {
        onColumnToggle(column.key);
      }
    });
  };

  // Filter fields based on search term
  const filteredFields = jiraFields.filter(field => 
    field.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate filtered fields into default and custom
  const defaultFieldIds = ['issuetype', 'summary', 'status', 'assignee', 'reporter', 'priority', 'created', 'updated'];
  
  const filteredDefaultFields = filteredFields.filter(field => 
    defaultFieldIds.includes(field.id) || !field.custom
  );
  
  const filteredCustomFields = filteredFields.filter(field => 
    field.custom && !defaultFieldIds.includes(field.id)
  );

  // Get selected columns from the current columns prop
  const selectedColumns = columns.filter(column => column.isSelected);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        appearance="default"
        onClick={() => setIsOpen(!isOpen)}
      >
        Columns
      </Button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 flex flex-col max-h-96 border border-gray-200">
          {/* Fixed header with title and reset button */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10 rounded-t-lg">
            <span className="font-medium text-gray-800">Select Columns</span>
            <Button 
              onClick={handleReset}
              appearance="subtle-link"
              spacing="compact"
            >
              Reset
            </Button>
          </div>
          
          <div className="flex-grow overflow-y-auto py-2">
            {/* Search Bar */}
            <div className="px-3 pb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="px-4 py-6 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <div className="mt-2">Loading fields...</div>
              </div>
            ) : (
              <>
                {/* Show selected fields at the top */}
                {selectedColumns.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 mx-2 rounded">
                      Selected Fields (Drag to reorder)
                    </div>
                    <div className="max-h-40 overflow-y-auto mb-2">
                      {selectedColumns.map((column, index) => (
                        <DraggableSelectedColumn
                          key={`selected-${column.key}`}
                          column={column}
                          index={index}
                          onColumnToggle={onColumnToggle}
                          onMove={handleMoveColumn}
                        />
                      ))}
                    </div>
                    <div className="border-t border-gray-200 mx-2"></div>
                  </>
                )}
                
                <div className="px-3 py-2">
                  {filteredDefaultFields.length > 0 && (
                    <>
                      <div className="px-1 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Default Fields
                      </div>
                      {filteredDefaultFields.map((field) => {
                        // Find matching column or create a temporary one
                        const matchingColumn = columns.find(col => col.key === field.id);
                        const isSelected = matchingColumn ? matchingColumn.isSelected : false;
                        
                        // Skip if already shown in selected fields
                        if (isSelected) return null;
                        
                        return (
                          <div 
                            key={field.id} 
                            className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer rounded transition-colors duration-150"
                          >
                            <div className="flex items-center h-5">
                              <Checkbox
                                isChecked={isSelected}
                                onChange={() => {
                                  if (matchingColumn) {
                                    onColumnToggle(matchingColumn.key);
                                  } else {
                                    // For new fields, we would need to add them to the columns state
                                    console.log('New field selected:', field.name);
                                  }
                                }}
                                label=""
                              />
                            </div>
                            <div className="ml-3 text-sm font-medium text-gray-700">
                              {field.name}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                  
                  {filteredCustomFields.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 my-2"></div>
                      <div className="px-1 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Custom Fields
                      </div>
                      {filteredCustomFields.map((field) => {
                        // Find matching column or create a temporary one
                        const matchingColumn = columns.find(col => col.key === field.id);
                        const isSelected = matchingColumn ? matchingColumn.isSelected : false;
                        
                        // Skip if already shown in selected fields
                        if (isSelected) return null;
                        
                        return (
                          <div 
                            key={field.id} 
                            className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer rounded transition-colors duration-150"
                          >
                            <div className="flex items-center h-5">
                              <Checkbox
                                isChecked={isSelected}
                                onChange={() => {
                                  if (matchingColumn) {
                                    onColumnToggle(matchingColumn.key);
                                  } else {
                                    // For new fields, we would need to add them to the columns state
                                    console.log('New custom field selected:', field.name);
                                  }
                                }}
                                label=""
                              />
                            </div>
                            <div className="ml-3 text-sm font-medium text-gray-700">
                              {field.name}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                  
                  {filteredFields.length === 0 && searchTerm && (
                    <div className="px-3 py-6 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="mt-2">No fields found</div>
                      <div className="mt-1 text-sm">No fields match "{searchTerm}"</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ColumnSelector: React.FC<ColumnSelectorProps> = (props) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <ColumnSelectorContent {...props} />
    </DndProvider>
  );
};

export default ColumnSelector;