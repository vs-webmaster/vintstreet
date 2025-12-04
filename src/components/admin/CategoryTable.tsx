// Category Table Component
// Displays categories in a table with actions

import { Edit, Trash2, Layers, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProductCategory } from '@/hooks/useCategoryManagement';

interface CategoryTableProps {
  categories: ProductCategory[];
  isLoading: boolean;
  onReorder: (categoryId: string, direction: 'up' | 'down') => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onManageSubcategories: (category: ProductCategory) => void;
  onEdit: (category: ProductCategory) => void;
  onDelete: (id: string) => void;
}

export const CategoryTable = ({
  categories,
  isLoading,
  onReorder,
  onToggleActive,
  onManageSubcategories,
  onEdit,
  onDelete,
}: CategoryTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Order</TableHead>
            <TableHead>Icon</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Synonyms</TableHead>
            <TableHead>Visible</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No categories found
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onReorder(category.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onReorder(category.id, 'down')}
                      disabled={index === categories.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {category.icon ? (
                    <img src={category.icon} alt={category.name} className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs">
                      No icon
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    {category.description && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{category.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {category.synonyms && category.synonyms.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {category.synonyms.slice(0, 3).map((syn, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {syn}
                        </Badge>
                      ))}
                      {category.synonyms.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.synonyms.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No synonyms</span>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={category.is_active}
                    onCheckedChange={() => onToggleActive(category.id, category.is_active)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageSubcategories(category)}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Manage subcategories
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
