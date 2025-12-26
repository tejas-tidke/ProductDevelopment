import React, { ReactNode, useState, useMemo } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "./Table";

interface Column<T> {
  key: string;
  title: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T, index: number) => void;
  selectedRow?: T | null;
  getRowKey: (row: T) => string;
  className?: string;
  loading?: boolean;
  emptyText?: string;
  rowClassName?: (row: T, index: number) => string;
}

function DataTable<T>({
  data,
  columns,
  onRowClick,
  selectedRow,
  getRowKey,
  className = "",
  loading = false,
  emptyText = "No data found",
  rowClassName = () => ""
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const getSortIndicator = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleRowClick = (row: T, index: number) => {
    onRowClick?.(row, index);
  };

  return (
    <div className={`border border-gray-200 rounded-lg bg-white shadow-sm ${className}`}>
      <div className="overflow-y-auto" style={{ height: '100%' }}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableCell 
                  key={column.key} 
                  isHeader={true}
                  className={column.className}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center">
                    {column.title}
                    {column.sortable && (
                      <span className="ml-1">
                        {getSortIndicator(column.key)}
                      </span>
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="text-center py-8" isHeader={false} colSpan={columns.length}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8 text-gray-500" isHeader={false} colSpan={columns.length}>
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, index) => (
                <TableRow
                  key={getRowKey(row)}
                  onClick={() => handleRowClick(row, index)}
                  selected={selectedRow ? getRowKey(selectedRow) === getRowKey(row) : false}
                  className={rowClassName(row, index)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render
                        ? column.render(getNestedValue(row, column.key), row)
                        : getNestedValue(row, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DataTable;