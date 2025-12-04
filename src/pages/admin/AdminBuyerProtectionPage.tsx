import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { useBuyerProtectionFees } from '@/hooks/useBuyerProtectionFees';
import { saveBuyerProtectionFees } from '@/services/settings';
import { isFailure } from '@/types/api';

interface FeeFormData {
  id?: string;
  min_price: string;
  max_price: string;
  percentage: string;
  isNew?: boolean;
}

export default function AdminBuyerProtectionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: fees, isLoading } = useBuyerProtectionFees();
  const [editedFees, setEditedFees] = useState<FeeFormData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data from fetched fees
  useState(() => {
    if (fees && editedFees.length === 0) {
      setEditedFees(
        fees.map((fee) => ({
          id: fee.id,
          min_price: fee.min_price.toString(),
          max_price: fee.max_price?.toString() || '',
          percentage: fee.percentage.toString(),
        })),
      );
    }
  });

  // Update form when fees load
  if (fees && editedFees.length === 0 && fees.length > 0) {
    setEditedFees(
      fees.map((fee) => ({
        id: fee.id,
        min_price: fee.min_price.toString(),
        max_price: fee.max_price?.toString() || '',
        percentage: fee.percentage.toString(),
      })),
    );
  }

  const saveMutation = useMutation({
    mutationFn: async (feesToSave: FeeFormData[]) => {
      const existingIds = fees?.map((f) => f.id) || [];
      const feesData = feesToSave.map((fee) => ({
        id: fee.id,
        min_price: parseFloat(fee.min_price),
        max_price: fee.max_price ? parseFloat(fee.max_price) : null,
        percentage: parseFloat(fee.percentage),
        isNew: fee.isNew,
      }));

      const result = await saveBuyerProtectionFees(feesData, existingIds);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-protection-fees'] });
      setHasChanges(false);
      toast({ title: 'Saved', description: 'Buyer protection fees updated successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to save fees.', variant: 'destructive' });
      console.error(error);
    },
  });

  const handleAddTier = () => {
    setEditedFees([...editedFees, { min_price: '', max_price: '', percentage: '', isNew: true }]);
    setHasChanges(true);
  };

  const handleRemoveTier = (index: number) => {
    setEditedFees(editedFees.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleFieldChange = (index: number, field: keyof FeeFormData, value: string) => {
    const updated = [...editedFees];
    updated[index] = { ...updated[index], [field]: value };
    setEditedFees(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate
    for (const fee of editedFees) {
      if (!fee.min_price || !fee.percentage) {
        toast({
          title: 'Validation Error',
          description: 'Min price and percentage are required.',
          variant: 'destructive',
        });
        return;
      }
      if (isNaN(parseFloat(fee.min_price)) || isNaN(parseFloat(fee.percentage))) {
        toast({ title: 'Validation Error', description: 'Invalid number format.', variant: 'destructive' });
        return;
      }
      if (fee.max_price && isNaN(parseFloat(fee.max_price))) {
        toast({ title: 'Validation Error', description: 'Invalid max price format.', variant: 'destructive' });
        return;
      }
    }

    saveMutation.mutate(editedFees);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Buyer Protection Fees</h1>
            <p className="text-muted-foreground">
              Configure tiered buyer protection fee percentages based on product price ranges.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddTier}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tier
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Price Tiers</CardTitle>
            <CardDescription>
              Define price ranges and their corresponding buyer protection fee percentages. Leave max price empty for
              "and above" ranges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : editedFees.length === 0 ? (
              <p className="text-muted-foreground">No tiers configured. Click "Add Tier" to create one.</p>
            ) : (
              <div className="space-y-4">
                {editedFees.map((fee, index) => (
                  <div key={index} className="flex items-end gap-4 rounded-lg border p-4">
                    <div className="flex-1 space-y-2">
                      <Label>Min Price (£)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={fee.min_price}
                        onChange={(e) => handleFieldChange(index, 'min_price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Max Price (£)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={fee.max_price}
                        onChange={(e) => handleFieldChange(index, 'max_price', e.target.value)}
                        placeholder="Leave empty for no limit"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Fee Percentage (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={fee.percentage}
                        onChange={(e) => handleFieldChange(index, 'percentage', e.target.value)}
                        placeholder="5"
                      />
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => handleRemoveTier(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>See how buyer protection fees will display for different prices.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[5, 15, 50, 150].map((testPrice) => {
                const matchingFee = editedFees.find((fee) => {
                  const min = parseFloat(fee.min_price) || 0;
                  const max = fee.max_price ? parseFloat(fee.max_price) : Infinity;
                  return testPrice >= min && testPrice <= max;
                });
                const feeAmount = matchingFee ? (testPrice * parseFloat(matchingFee.percentage || '0')) / 100 : null;

                return (
                  <div key={testPrice} className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">£{testPrice} product</p>
                    <p className="text-lg font-bold text-primary">
                      {feeAmount !== null ? `£${feeAmount.toFixed(2)}` : 'No tier'}
                    </p>
                    {matchingFee && <p className="text-xs text-muted-foreground">({matchingFee.percentage}%)</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
