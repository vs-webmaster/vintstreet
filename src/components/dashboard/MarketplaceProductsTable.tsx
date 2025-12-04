import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Ban, CheckCircle, X } from 'lucide-react';
import { useTableSort } from '@/hooks/useTableSort';
import { useLevel1Categories, useLevel2Categories } from '@/hooks/useCategoryLevelQueries';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchBrands } from '@/services/brands';
import { fetchMarketplaceProducts, updateProductModerationStatus } from '@/services/products';
import { fetchSellerProfilesByShopNames } from '@/services/users';
import { isFailure } from '@/types/api';

export const MarketplaceProductsTable = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel1, setFilterLevel1] = useState<string>('all');
  const [filterLevel2, setFilterLevel2] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [lastUpdatedFilter, setLastUpdatedFilter] = useState<string>('all');
  const { sortField, sortDirection, setSortField, setSortDirection, handleSort, SortIcon } = useTableSort(
    'created_at',
    'desc',
  );

  // Fetch system seller
  const { data: systemSeller } = useQuery({
    queryKey: ['system-seller'],
    queryFn: async () => {
      const result = await fetchSellerProfilesByShopNames(['VintStreet System']);
      if (isFailure(result)) throw result.error;
      const seller = result.data.find((s) => s.shop_name === 'VintStreet System');
      return seller ? { user_id: seller.user_id } : null;
    },
  });

  // Fetch filter options
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const result = await fetchBrands({ isActive: true });
      if (isFailure(result)) throw result.error;
      return result.data.map((b) => ({ id: b.id, name: b.name }));
    },
    staleTime: 300000,
  });

  const { data: level1Categories = [] } = useLevel1Categories();
  const { data: level2Categories = [] } = useLevel2Categories(filterLevel1);

  // Fetch marketplace products (excluding system seller)
  const { data: products = [], isLoading } = useQuery({
    queryKey: [
      'marketplace-products',
      searchTerm,
      filterStatus,
      filterLevel1,
      filterLevel2,
      filterBrand,
      lastUpdatedFilter,
      sortField,
      sortDirection,
      systemSeller?.user_id,
    ],
    queryFn: async () => {
      // Calculate createdAfter date for time-based filter
      let createdAfter: string | undefined;
      if (lastUpdatedFilter !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (lastUpdatedFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = new Date(0);
        }

        createdAfter = startDate.toISOString();
      }

      const result = await fetchMarketplaceProducts({
        excludeSellerId: systemSeller?.user_id,
        searchTerm: searchTerm || undefined,
        moderationStatus: filterStatus !== 'all' ? filterStatus : undefined,
        categoryId: filterLevel1 !== 'all' ? filterLevel1 : undefined,
        subcategoryId: filterLevel2 !== 'all' ? filterLevel2 : undefined,
        brandId: filterBrand !== 'all' ? filterBrand : undefined,
        createdAfter,
        sortField,
        sortDirection: sortDirection as 'asc' | 'desc',
      });

      if (isFailure(result)) throw result.error;

      // If system seller wasn't found, filter out by shop_name as a safeguard
      const filtered = !systemSeller?.user_id
        ? (result.data || []).filter((p: unknown) => p.seller?.shop_name !== 'VintStreet System')
        : result.data;

      return filtered || [];
    },
    enabled: true,
  });

  // Reset Level 2 filter when Level 1 changes
  useEffect(() => {
    if (filterLevel1 === 'all') {
      setFilterLevel2('all');
    }
  }, [filterLevel1]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuspend = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'approved' : 'suspended';
    const action = newStatus === 'suspended' ? 'suspend' : 'unsuspend';

    try {
      const result = await updateProductModerationStatus(productId, newStatus);
      if (isFailure(result)) throw result.error;

      toast.success(`Product ${action}ed successfully`);
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
    } catch (error) {
      console.error(`Error ${action}ing product:`, error);
      toast.error(`Failed to ${action} product`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { variant: 'default' as const, label: 'Active' },
      suspended: { variant: 'destructive' as const, label: 'Suspended' },
      pending: { variant: 'secondary' as const, label: 'Pending' },
      rejected: { variant: 'outline' as const, label: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setFilterStatus('all');
    setFilterLevel1('all');
    setFilterLevel2('all');
    setFilterBrand('all');
    setLastUpdatedFilter('all');
    setSortField('created_at');
    setSortDirection('desc');
  };

  const hasActiveFilters =
    searchTerm ||
    filterStatus !== 'all' ||
    filterLevel1 !== 'all' ||
    filterLevel2 !== 'all' ||
    filterBrand !== 'all' ||
    lastUpdatedFilter !== 'all';

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading products...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Search by product name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="max-w-md"
              />
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLevel1} onValueChange={setFilterLevel1}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {level1Categories.map((cat: unknown) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filterLevel1 !== 'all' && (
              <Select value={filterLevel2} onValueChange={setFilterLevel2}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {level2Categories.map((cat: unknown) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand: unknown) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={lastUpdatedFilter} onValueChange={setLastUpdatedFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Added" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" onClick={resetFilters} size="sm">
                <X className="mr-1 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary">
                Search: {searchTerm}
                <button
                  onClick={() => {
                    setSearchInput('');
                    setSearchTerm('');
                  }}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filterStatus !== 'all' && (
              <Badge variant="secondary">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('all')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filterLevel1 !== 'all' && (
              <Badge variant="secondary">
                Category: {level1Categories.find((c: unknown) => c.id === filterLevel1)?.name}
                <button
                  onClick={() => {
                    setFilterLevel1('all');
                    setFilterLevel2('all');
                  }}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filterLevel2 !== 'all' && (
              <Badge variant="secondary">
                Subcategory: {level2Categories.find((c: unknown) => c.id === filterLevel2)?.name}
                <button onClick={() => setFilterLevel2('all')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filterBrand !== 'all' && (
              <Badge variant="secondary">
                Brand: {brands.find((b: unknown) => b.id === filterBrand)?.name}
                <button onClick={() => setFilterBrand('all')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {lastUpdatedFilter !== 'all' && (
              <Badge variant="secondary">
                Added:{' '}
                {lastUpdatedFilter === 'today'
                  ? 'Today'
                  : lastUpdatedFilter === 'week'
                    ? 'Last 7 Days'
                    : 'Last 30 Days'}
                <button onClick={() => setLastUpdatedFilter('all')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {products.length} marketplace product{products.length !== 1 ? 's' : ''}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('product_name')} className="h-8 px-2">
                    Product
                    <SortIcon field="product_name" />
                  </Button>
                </TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('starting_price')} className="h-8 px-2">
                    Price
                    <SortIcon field="starting_price" />
                  </Button>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('created_at')} className="h-8 px-2">
                    Listed
                    <SortIcon field="created_at" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No marketplace products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product: unknown) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img
                        src={product.thumbnail || '/placeholder.svg'}
                        alt={product.product_name}
                        className="h-16 w-16 rounded object-cover"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.product_name}</div>
                      {product.brands?.name && (
                        <div className="text-sm text-muted-foreground">{product.brands.name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={product.seller?.profile_image} />
                          <AvatarFallback>
                            {(product.seller?.shop_name || product.seller_id || '')
                              .toString()
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {product.seller?.shop_name || `Seller ${String(product.seller_id).slice(0, 6)}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(product.starting_price)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {product.product_categories?.name}
                        {product.product_subcategories?.name && (
                          <div className="text-xs text-muted-foreground">{product.product_subcategories.name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(product.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(product.moderation_status || 'approved')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/product/${product.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={product.moderation_status === 'suspended' ? 'default' : 'destructive'}
                          size="sm"
                          onClick={() => handleSuspend(product.id, product.moderation_status || 'approved')}
                        >
                          {product.moderation_status === 'suspended' ? (
                            <>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Unsuspend
                            </>
                          ) : (
                            <>
                              <Ban className="mr-1 h-4 w-4" />
                              Suspend
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};
