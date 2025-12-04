import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StockManagementFormProps {
  itemType: string;
  stockQuantity: string;
  onItemTypeChange: (value: string) => void;
  onStockQuantityChange: (value: string) => void;
}

export const StockManagementForm = ({
  itemType,
  stockQuantity,
  onItemTypeChange,
  onStockQuantityChange,
}: StockManagementFormProps) => {
  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Stock Management</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="itemType" className="mb-2 block">
            Item Type *
          </Label>
          <Select value={itemType} onValueChange={onItemTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select item type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Item</SelectItem>
              <SelectItem value="multi">Multi Item (with quantity)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {itemType === 'multi' && (
          <div>
            <Label htmlFor="stockQuantity" className="mb-2 block">
              Stock Quantity *
            </Label>
            <Input
              id="stockQuantity"
              type="number"
              min="1"
              value={stockQuantity}
              onChange={(e) => onStockQuantityChange(e.target.value)}
              placeholder="Enter available quantity"
              required
            />
          </div>
        )}
      </div>
    </Card>
  );
};
