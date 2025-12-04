import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductFormHeaderProps {
  isEditMode: boolean;
  onBack: () => void;
}

export const ProductFormHeader = ({ isEditMode, onBack }: ProductFormHeaderProps) => {
  return (
    <div className="mb-8 flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div>
        <h1 className="text-3xl font-bold text-foreground">{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
        <p className="mt-1 text-muted-foreground">
          {isEditMode ? 'Update your product details' : 'Add a new product to your shop'}
        </p>
      </div>
    </div>
  );
};
