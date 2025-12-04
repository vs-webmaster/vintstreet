import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface UseTableSortReturn {
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  setSortField: (field: string | null) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  handleSort: (field: string) => void;
  SortIcon: React.FC<{ field: string }>;
}

export function useTableSort(defaultField: string | null = null, defaultDirection: 'asc' | 'desc' = 'asc'): UseTableSortReturn {
  const [sortField, setSortField] = useState<string | null>(defaultField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultDirection);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return {
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    handleSort,
    SortIcon,
  };
}
