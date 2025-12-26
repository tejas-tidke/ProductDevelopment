import React, { ReactNode } from "react";

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
  onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
  selected?: boolean;
}

// Props for TableCell
interface TableCellProps {
  children: ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td
  className?: string; // Optional className for styling
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
  colSpan?: number;
  rowSpan?: number;
  ref?: React.Ref<HTMLTableCellElement>;
}

// Standard Table Component
const Table: React.FC<TableProps> = ({ children, className = "" }) => {
  return (
    <table className={`min-w-full text-sm ${className}`}>{children}</table>
  );
};

// Standard TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className = "" }) => {
  return <thead className={className}>{children}</thead>;
};

// Standard TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className = "" }) => {
  return <tbody className={className}>{children}</tbody>;
};

// Standard TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className = "", onClick, selected = false }) => {
  const baseClasses = "border-b border-gray-200 hover:bg-indigo-50/40 transition-colors";
  const selectedClasses = selected ? "bg-indigo-50" : "";
  const clickableClasses = onClick ? "cursor-pointer" : "";
  
  return (
    <tr 
      className={`${baseClasses} ${selectedClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

// Standard TableCell Component
const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({ 
  children, 
  isHeader = false, 
  className = "",
  onClick,
  colSpan,
  rowSpan
}) => {
  const baseClasses = isHeader 
    ? "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 sticky top-0 z-10 shadow" 
    : "px-4 py-3 text-gray-900";
  
  const CellTag = isHeader ? "th" : "td";
  
  return (
    <CellTag 
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      {children}
    </CellTag>
  );
});

TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableCell };