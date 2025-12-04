import { Product } from '@/hooks/useProductData';

interface ProductAttributesProps {
  product: Product;
}

export const ProductAttributes = ({ product }: ProductAttributesProps) => {
  // Note: colour_options, material_options, condition_options have been removed
  // This component is kept for future attribute implementations
  return null;
};
