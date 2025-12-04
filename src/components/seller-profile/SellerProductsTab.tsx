import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { CachedImage } from '@/components/CachedImage';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SellerProductsTabProps {
  products: any[];
}

const PRODUCTS_PER_PAGE = 24;

export const SellerProductsTab = ({ products }: SellerProductsTabProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium">Products ({products.length})</h3>
      </div>

      {products.length === 0 ? (
        <div className="py-8 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No products listed</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {paginatedProducts.map((product) => {
              const productUrl = product.slug || product.id;
              return (
                <Link to={`/product/${productUrl}`} key={product.id}>
                  <div className="cursor-pointer rounded border p-3 transition-shadow hover:shadow-lg">
                    <CachedImage
                      src={
                        product.thumbnail ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'
                      }
                      alt={`${product.product_name}-vintstreet`}
                      className="mb-2 aspect-square w-full rounded object-cover"
                    />
                    <h4 className="truncate text-sm font-medium">{product.product_name}</h4>
                    <PriceDisplay gbpPrice={Number(product.starting_price)} className="text-sm font-bold" />
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousPage} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {getPageNumbers().map((page, index) =>
                typeof page === 'number' ? (
                  <Button
                    key={index}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => handlePageClick(page)}
                  >
                    {page}
                  </Button>
                ) : (
                  <span key={index} className="px-2 text-muted-foreground">
                    {page}
                  </span>
                ),
              )}

              <Button variant="outline" size="icon" onClick={handleNextPage} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
};
