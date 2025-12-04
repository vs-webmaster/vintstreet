import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/hooks/useProductData';

interface ProductHeaderProps {
  product: Product;
}

export const ProductHeader = ({ product }: ProductHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        {/* Brand Logo */}
        {product.brands?.logo_url && (
          <img src={product.brands.logo_url} alt={`${product.brands.name} logo`} className="mb-3 h-8 object-contain" />
        )}

        <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">{product.product_name}</h1>

        {/* Listed Date */}
        <p className="mb-4 text-sm text-muted-foreground">
          Listed{' '}
          {new Date(product.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Tags: Category, Subcategory, Sub-subcategory, Brand */}
      <div className="flex flex-wrap items-center gap-2">
        {product.product_categories && <Badge variant="outline">{product.product_categories.name}</Badge>}
        {product.product_subcategories && <Badge variant="outline">{product.product_subcategories.name}</Badge>}
        {product.product_sub_subcategories && <Badge variant="outline">{product.product_sub_subcategories.name}</Badge>}
        {product.brands && (
          <Badge
            variant="secondary"
            className="cursor-pointer transition-colors hover:bg-secondary/80"
            onClick={() => navigate(`/shop?brand=${encodeURIComponent(product.brands.name)}`)}
          >
            {product.brands.name}
          </Badge>
        )}
      </div>
    </div>
  );
};
