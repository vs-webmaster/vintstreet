/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Eye,
  FileSpreadsheet,
  Check,
  ChevronsUpDown,
  X,
  Filter,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Copy,
} from 'lucide-react';
import { useTableSort } from '@/hooks/useTableSort';
import { useLevel1Categories, useLevel2Categories } from '@/hooks/useCategoryLevelQueries';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebounce } from '@/hooks/useDebounce';
import { useProductsWithPagination } from '@/hooks/useProductsWithPagination';
import { cn, uniqueByNameSorted } from '@/lib/utils';
import {
  fetchAttributeByName,
  fetchAllAttributes,
  fetchAttributeSubcategories,
  fetchAttributeSubSubcategories,
  fetchAttributeOptions,
  fetchColorAttributeOptions,
} from '@/services/attributes';
import { fetchBrands } from '@/services/brands';
import { fetchLevel3CategoriesWithFilters, fetchLevel4CategoriesWithFilters } from '@/services/categories';
import {
  bulkArchiveProducts,
  duplicateProduct,
  updateProduct,
  toggleArchiveProduct,
  archiveProduct,
} from '@/services/products';
import { isFailure } from '@/types/api';
import { ProductEditModal } from './ProductEditModal';

interface MasterProductsTableProps {
  systemSellerId?: string;
  showSoldProducts?: boolean;
  showArchivedProducts?: boolean;
  showDraftProducts?: boolean;
  showPrivateProducts?: boolean;
  showMissingImages?: boolean;
  showPublishedProducts?: boolean;
}

export const MasterProductsTable = ({
  systemSellerId,
  showSoldProducts = false,
  showArchivedProducts = false,
  showDraftProducts = false,
  showPrivateProducts = false,
  showMissingImages = false,
  showPublishedProducts = false,
}: MasterProductsTableProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Handler to update product status with optimistic updates
  const handleStatusChange = async (productId: string, newStatus: string) => {
    // Optimistically update the UI
    queryClient.setQueriesData({ queryKey: ['master-products-paginated'] }, (oldData: unknown) => {
      if (!oldData) return oldData;
      return oldData.map((product: unknown) => (product.id === productId ? { ...product, status: newStatus } : product));
    });

    try {
      const result = await updateProduct(productId, { status: newStatus } as any);

      if (isFailure(result)) {
        throw result.error;
      }

      toast.success(`Status updated to ${newStatus}`);

      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['master-products-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['products-count'] });
    } catch (error) {
      // Rollback on error
      queryClient.invalidateQueries({ queryKey: ['master-products-paginated'] });
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchTerm = useDebounce(searchInput, 300); // 300ms debounce
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterLevel1, setFilterLevel1] = useState<string>('all');
  const [filterLevel2, setFilterLevel2] = useState<string>('all');
  const { sortField, sortDirection, setSortField, setSortDirection, handleSort, SortIcon } = useTableSort(null, 'asc');
  const [lastUpdatedFilter, setLastUpdatedFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [brandSearchOpen, setBrandSearchOpen] = useState(false);
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [missingAttributeFilter, setMissingAttributeFilter] = useState<string | null>(null);
  const [missingLevel2Filter, setMissingLevel2Filter] = useState(false);
  const [missingLevel3Filter, setMissingLevel3Filter] = useState(false);
  const [missingLevel4Filter, setMissingLevel4Filter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [filterLevel3, setFilterLevel3] = useState<string[]>([]);
  const [filterLevel4, setFilterLevel4] = useState<string[]>([]);
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch colour attribute
  const { data: colourAttribute } = useQuery({
    queryKey: ['colour-attribute'],
    queryFn: async () => {
      const result = await fetchAttributeByName('Colour');
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on search
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Use optimized pagination hook
  const { products, productAttributeValues, totalCount, isLoading } = useProductsWithPagination({
    systemSellerId,
    showArchivedProducts,
    showSoldProducts,
    showDraftProducts,
    showPrivateProducts,
    showMissingImages,
    showPublishedProducts,
    currentPage,
    itemsPerPage,
    searchTerm: debouncedSearchTerm, // Use debounced search term
    filterBrand,
    filterLevel1,
    filterLevel2,
    filterLevel3,
    filterLevel4, // Now using IDs directly
    filterColors,
    colourAttributeId: colourAttribute?.id,
    lastUpdatedFilter,
    sortField,
    sortDirection,
    missingLevel2: missingLevel2Filter,
    missingLevel3: missingLevel3Filter,
    missingLevel4: missingLevel4Filter,
    missingAttributeId: missingAttributeFilter,
    statusFilter,
  });

  // Fetch filter options (cached with longer stale time)
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const result = await fetchBrands({ isActive: true });
      if (isFailure(result)) throw result.error;
      return result.data.map((b) => ({ id: b.id, name: b.name }));
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch attributes for advanced filtering (lazy loaded)
  const { data: allAttributes = [] } = useQuery({
    queryKey: ['all-attributes'],
    enabled: advancedFilterOpen, // Only load when dialog is open
    queryFn: async () => {
      const result = await fetchAllAttributes();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 300000,
  });

  // Fetch attribute relationships (lazy loaded)
  const { data: attributeSubcategoryLinks = [] } = useQuery({
    queryKey: ['attribute-subcategory-links'],
    enabled: advancedFilterOpen && missingAttributeFilter !== null,
    queryFn: async () => {
      const result = await fetchAttributeSubcategories();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 300000,
  });

  const { data: attributeSubSubcategoryLinks = [] } = useQuery({
    queryKey: ['attribute-sub_subcategory-links'],
    enabled: advancedFilterOpen && missingAttributeFilter !== null,
    queryFn: async () => {
      const result = await fetchAttributeSubSubcategories();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 300000,
  });

  // Fetch attribute options (lazy loaded)
  const { data: attributeOptions = [] } = useQuery({
    queryKey: ['attribute-options'],
    enabled: advancedFilterOpen,
    queryFn: async () => {
      const result = await fetchAttributeOptions(10000);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 300000,
  });

  const { data: level1Categories = [] } = useLevel1Categories();
  const { data: level2Categories = [] } = useLevel2Categories(filterLevel1);

  // Fetch Level 3 categories (filtered by Level 1/2)
  const { data: level3Categories = [] } = useQuery({
    queryKey: ['level3-categories-filter', filterLevel1, filterLevel2],
    queryFn: async () => {
      const result = await fetchLevel3CategoriesWithFilters({
        level1Id: filterLevel1 !== 'all' ? filterLevel1 : undefined,
        level2Id: filterLevel2 !== 'all' ? filterLevel2 : undefined,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      return uniqueByNameSorted(result.data || []);
    },
    staleTime: 300000,
  });

  // Fetch Level 4 categories (filtered by Level 1/2/3)
  const { data: level4Categories = [] } = useQuery({
    queryKey: ['level4-categories-filter', filterLevel1, filterLevel2, filterLevel3],
    queryFn: async () => {
      const result = await fetchLevel4CategoriesWithFilters({
        level1Id: filterLevel1 !== 'all' ? filterLevel1 : undefined,
        level2Id: filterLevel2 !== 'all' ? filterLevel2 : undefined,
        level3Ids: filterLevel3.length > 0 ? filterLevel3 : undefined,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      return uniqueByNameSorted(result.data || []);
    },
    staleTime: 300000,
    enabled: level3Categories.length > 0 || filterLevel3.length > 0, // Only run when Level 3 data is available
  });

  // Fetch colors from attribute options
  const { data: colors = [] } = useQuery<string[]>({
    queryKey: ['colors-filter'],
    queryFn: async (): Promise<string[]> => {
      const result = await fetchColorAttributeOptions();
      if (isFailure(result)) {
        console.error('Error fetching colors:', result.error);
        return [];
      }
      return result.data || [];
    },
    staleTime: 300000,
  });

  // Pre-calculate custom attribute counts with memoization
  const customAttributeCounts = useMemo(() => {
    const counts = new Map<string, number>();

    const normalize = (v: string) => v?.trim().toLowerCase();

    products.forEach((product: unknown) => {
      const productValues = productAttributeValues.filter((pav: unknown) => pav.product_id === product.id);
      let customCount = 0;

      productValues.forEach((pav: unknown) => {
        if (!pav.value_text) return;

        const attribute = allAttributes.find((attr: unknown) => attr.id === pav.attribute_id);
        if (!attribute) return;

        const activeOptions = attributeOptions
          .filter((opt: unknown) => opt.attribute_id === pav.attribute_id)
          .map((opt: unknown) => normalize(opt.value));

        if (activeOptions.length === 0) return;

        const addIfCustom = (value: string) => {
          const v = normalize(value);
          if (!v) return;
          if (!activeOptions.includes(v)) customCount++;
        };

        if (attribute.data_type === 'multi-select') {
          let valuesToCheck: string[] = [];
          try {
            valuesToCheck = JSON.parse(pav.value_text);
          } catch {
            valuesToCheck = pav.value_text.split(',').map((v: string) => v.trim());
          }
          valuesToCheck.forEach(addIfCustom);
        } else {
          addIfCustom(pav.value_text);
        }
      });

      counts.set(product.id, customCount);
    });

    return counts;
  }, [products, productAttributeValues, allAttributes, attributeOptions]);

  // Apply client-side only filters
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Note: missing attribute filter is now handled in the database query
    // Only keep client-side sorting for custom_opts

    // Client-side sorting for custom_opts (since it's calculated client-side)
    if (sortField === 'custom_opts') {
      filtered = [...filtered].sort((a: unknown, b: unknown) => {
        const countA = customAttributeCounts.get(a.id) || 0;
        const countB = customAttributeCounts.get(b.id) || 0;
        return sortDirection === 'asc' ? countA - countB : countB - countA;
      });
    }

    return filtered;
  }, [products, sortField, sortDirection, customAttributeCounts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    filterBrand,
    filterLevel1,
    filterLevel2,
    filterLevel3,
    filterLevel4,
    filterColors,
    lastUpdatedFilter,
    sortField,
    sortDirection,
    missingAttributeFilter,
    missingLevel2Filter,
    missingLevel3Filter,
    missingLevel4Filter,
    statusFilter,
  ]);

  // Clear Level 3 and 4 filters when Level 1 changes
  useEffect(() => {
    if (filterLevel1 !== 'all') {
      setFilterLevel3([]);
      setFilterLevel4([]);
    }
  }, [filterLevel1]);

  // Clear Level 4 filter when Level 2 or Level 3 changes
  useEffect(() => {
    setFilterLevel4([]);
  }, [filterLevel2, filterLevel3]);

  const resetFilters = () => {
    setSearchInput('');
    setFilterBrand('all');
    setFilterLevel1('all');
    setFilterLevel2('all');
    setFilterLevel3([]);
    setFilterLevel4([]);
    setFilterColors([]);
    setLastUpdatedFilter('all');
    setSortField(null);
    setSortDirection('asc');
    setMissingAttributeFilter(null);
    setMissingLevel2Filter(false);
    setMissingLevel3Filter(false);
    setMissingLevel4Filter(false);
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const handleBulkEdit = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products to edit');
      return;
    }
    navigate('/admin/products/bulk-edit', {
      state: { productIds: selectedProducts },
    });
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error(showArchivedProducts ? 'Please select products to restore' : 'Please select products to archive');
      return;
    }

    const action = showArchivedProducts ? 'restore' : 'archive';
    if (
      !confirm(
        `Are you sure you want to ${action} ${selectedProducts.length} product${
          selectedProducts.length !== 1 ? 's' : ''
        }?`,
      )
    ) {
      return;
    }

    try {
      const result = await bulkArchiveProducts(selectedProducts, !showArchivedProducts);

      if (isFailure(result)) {
        throw result.error;
      }

      toast.success(
        `Successfully ${action}d ${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''}`,
      );
      setSelectedProducts([]);
      queryClient.invalidateQueries({ queryKey: ['master-products-paginated'] });
    } catch (error) {
      console.error(`Error ${action}ing products:`, error);
      toast.error(`Failed to ${action} products`);
    }
  };

  const handleArchive = async (productId: string, isArchived: boolean) => {
    try {
      const result = await toggleArchiveProduct(productId, isArchived);

      if (isFailure(result)) {
        throw result.error;
      }

      toast.success(isArchived ? 'Product unarchived successfully' : 'Product archived successfully');
      queryClient.invalidateQueries({ queryKey: ['master-products-paginated'] });
    } catch (error) {
      console.error('Error archiving product:', error);
      toast.error('Failed to archive product');
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to archive "${productName}"?`)) {
      return;
    }

    try {
      const result = await archiveProduct(productId);

      if (isFailure(result)) {
        throw result.error;
      }

      toast.success('Product archived successfully');
      queryClient.invalidateQueries({ queryKey: ['master-products-paginated'] });
    } catch (error) {
      console.error('Error archiving product:', error);
      toast.error('Failed to archive product');
    }
  };

  const handleDuplicate = async (productId: string) => {
    try {
      toast.loading('Duplicating product...');

      const result = await duplicateProduct(productId);

      if (isFailure(result)) {
        throw result.error;
      }

      toast.dismiss();
      toast.success('Product duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['master-products-paginated'] });

      // Open edit modal for the new product
      navigate(`/edit-product/${result.data.id}`);
    } catch (error) {
      console.error('Error duplicating product:', error);
      toast.dismiss();
      toast.error('Failed to duplicate product');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
        </PaginationItem>,
      );
      if (startPage > 2) {
        items.push(<PaginationEllipsis key="ellipsis-start" />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => setCurrentPage(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationEllipsis key="ellipsis-end" />);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages}</PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex gap-2 lg:w-auto">
            <Input
              placeholder="Search products by name, description, or SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="lg:w-64"
            />
            <Button onClick={handleSearch} variant="secondary">
              Search
            </Button>
          </div>

          <Select value={filterLevel1} onValueChange={setFilterLevel1}>
            <SelectTrigger className="lg:w-40">
              <SelectValue placeholder="Level 1" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Level 1</SelectItem>
              {level1Categories
                .filter((cat: unknown) => cat.id)
                .map((cat: unknown) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={filterLevel2} onValueChange={setFilterLevel2}>
            <SelectTrigger className="lg:w-40">
              <SelectValue placeholder="Level 2" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Level 2</SelectItem>
              {level2Categories
                .filter((cat: unknown) => cat.id)
                .map((cat: unknown) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Level 3 Categories Multi-Select */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between lg:w-48">
                Level 3 {filterLevel3.length > 0 && `(${filterLevel3.length})`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {level3Categories.map((cat: unknown) => {
                      const isSelected = filterLevel3.includes(cat.id);
                      return (
                        <CommandItem
                          key={cat.id}
                          onSelect={() => {
                            setFilterLevel3((prev) =>
                              isSelected ? prev.filter((id) => id !== cat.id) : [...prev, cat.id],
                            );
                          }}
                        >
                          <Checkbox checked={isSelected} className="mr-2" />
                          {cat.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Level 4 Categories Multi-Select */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between lg:w-48">
                Level 4 {filterLevel4.length > 0 && `(${filterLevel4.length})`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {level4Categories.map((cat: unknown) => {
                      const isSelected = filterLevel4.includes(cat.id);
                      return (
                        <CommandItem
                          key={cat.id}
                          onSelect={() => {
                            setFilterLevel4((prev) =>
                              isSelected ? prev.filter((id) => id !== cat.id) : [...prev, cat.id],
                            );
                          }}
                        >
                          <Checkbox checked={isSelected} className="mr-2" />
                          {cat.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Colors Multi-Select */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between lg:w-48">
                Colors {filterColors.length > 0 && `(${filterColors.length})`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {colors.map((color: string) => {
                      const isSelected = filterColors.includes(color);
                      return (
                        <CommandItem
                          key={color}
                          onSelect={() => {
                            setFilterColors((prev) =>
                              isSelected ? prev.filter((c) => c !== color) : [...prev, color],
                            );
                          }}
                        >
                          <Checkbox checked={isSelected} className="mr-2" />
                          {color}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover open={brandSearchOpen} onOpenChange={setBrandSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={brandSearchOpen}
                className="justify-between lg:w-48"
              >
                {filterBrand === 'all'
                  ? 'All Brands'
                  : brands.find((brand: unknown) => brand.id === filterBrand)?.name || 'Select brand'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search brands..." />
                <CommandEmpty>No brand found.</CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setFilterBrand('all');
                      setBrandSearchOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', filterBrand === 'all' ? 'opacity-100' : 'opacity-0')} />
                    All Brands
                  </CommandItem>
                  {brands.map((brand: unknown) => (
                    <CommandItem
                      key={brand.id}
                      value={brand.name}
                      onSelect={() => {
                        setFilterBrand(brand.id);
                        setBrandSearchOpen(false);
                      }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', filterBrand === brand.id ? 'opacity-100' : 'opacity-0')} />
                      {brand.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          <Select value={lastUpdatedFilter} onValueChange={setLastUpdatedFilter}>
            <SelectTrigger className="lg:w-52">
              <SelectValue placeholder="Products Updated" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Time</SelectItem>
              <SelectItem value="24hours">Updated in Last 24 Hours</SelectItem>
              <SelectItem value="7days">Updated in Last 7 Days</SelectItem>
              <SelectItem value="30days">Updated in Last 30 Days</SelectItem>
              <SelectItem value="90days">Updated in Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortField ? `${sortField}-${sortDirection}` : 'default'}
            onValueChange={(value) => {
              if (value === 'default') {
                setSortField(null);
                setSortDirection('asc');
              } else {
                const [field, dir] = value.split('-');
                setSortField(field);
                setSortDirection(dir as 'asc' | 'desc');
              }
            }}
          >
            <SelectTrigger className="lg:w-36">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="product_name-asc">Name A-Z</SelectItem>
              <SelectItem value="product_name-desc">Name Z-A</SelectItem>
              <SelectItem value="starting_price-asc">Price Low-High</SelectItem>
              <SelectItem value="starting_price-desc">Price High-Low</SelectItem>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={resetFilters} className="lg:ml-auto">
            <X className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">
              {totalCount} {totalCount === 1 ? 'result' : 'results'}
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={advancedFilterOpen} onOpenChange={setAdvancedFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Advanced Filter
                    {(missingAttributeFilter || missingLevel2Filter || missingLevel3Filter || missingLevel4Filter) && (
                      <Badge variant="secondary" className="ml-2">
                        {
                          [
                            missingAttributeFilter,
                            missingLevel2Filter,
                            missingLevel3Filter,
                            missingLevel4Filter,
                          ].filter(Boolean).length
                        }
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Advanced Filters</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Find Products Missing Categories</label>
                        {(missingLevel2Filter || missingLevel3Filter || missingLevel4Filter) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMissingLevel2Filter(false);
                              setMissingLevel3Filter(false);
                              setMissingLevel4Filter(false);
                            }}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Toggle to find products missing specific category levels
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={missingLevel2Filter ? 'default' : 'outline'}
                          className="cursor-pointer justify-start px-3 py-2 hover:bg-accent"
                          onClick={() => setMissingLevel2Filter(!missingLevel2Filter)}
                        >
                          Missing Level 2
                        </Badge>
                        <Badge
                          variant={missingLevel3Filter ? 'default' : 'outline'}
                          className="cursor-pointer justify-start px-3 py-2 hover:bg-accent"
                          onClick={() => setMissingLevel3Filter(!missingLevel3Filter)}
                        >
                          Missing Level 3
                        </Badge>
                        <Badge
                          variant={missingLevel4Filter ? 'default' : 'outline'}
                          className="cursor-pointer justify-start px-3 py-2 hover:bg-accent"
                          onClick={() => setMissingLevel4Filter(!missingLevel4Filter)}
                        >
                          Missing Level 4
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Find Products Missing Attribute</label>
                        {missingAttributeFilter && (
                          <Button variant="ghost" size="sm" onClick={() => setMissingAttributeFilter(null)}>
                            <X className="mr-1 h-4 w-4" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click an attribute to find products that don't have a value for it
                      </p>
                      <div className="grid max-h-[400px] grid-cols-2 gap-2 overflow-y-auto p-1 md:grid-cols-3">
                        {allAttributes.map((attr: unknown) => (
                          <Badge
                            key={attr.id}
                            variant={missingAttributeFilter === attr.id ? 'default' : 'outline'}
                            className="cursor-pointer justify-start px-3 py-2 hover:bg-accent"
                            onClick={() =>
                              setMissingAttributeFilter(missingAttributeFilter === attr.id ? null : attr.id)
                            }
                          >
                            {attr.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button onClick={() => setAdvancedFilterOpen(false)} className="w-full">
                      Apply Filter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {selectedProducts.length > 0 && (
                <>
                  <Button onClick={handleBulkEdit} variant="default" size="sm">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Bulk Edit ({selectedProducts.length})
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    variant={showArchivedProducts ? 'default' : 'destructive'}
                    size="sm"
                  >
                    {showArchivedProducts ? (
                      <>
                        <ArchiveRestore className="mr-2 h-4 w-4" />
                        Restore ({selectedProducts.length})
                      </>
                    ) : (
                      <>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive ({selectedProducts.length})
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(() => {
            const activeFiltersCount =
              (filterBrand !== 'all' ? 1 : 0) +
              (filterLevel1 !== 'all' ? 1 : 0) +
              (filterLevel2 !== 'all' ? 1 : 0) +
              filterLevel3.length +
              filterLevel4.length +
              filterColors.length +
              (missingAttributeFilter ? 1 : 0) +
              (missingLevel2Filter ? 1 : 0) +
              (missingLevel3Filter ? 1 : 0) +
              (missingLevel4Filter ? 1 : 0);

            if (activeFiltersCount === 0) return null;

            return (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>
                  {activeFiltersCount} active {activeFiltersCount === 1 ? 'filter' : 'filters'} • Showing {totalCount}{' '}
                  {totalCount === 1 ? 'product' : 'products'}
                </span>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto h-auto py-1">
                  Clear all filters
                </Button>
              </div>
            );
          })()}

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedProducts.length === filteredProducts.length &&
                        filteredProducts.length > 0 &&
                        filteredProducts.every((p: unknown) => selectedProducts.includes(p.id))
                      }
                      onCheckedChange={() => {
                        const allSelected = filteredProducts.every((p: unknown) => selectedProducts.includes(p.id));
                        if (allSelected) {
                          setSelectedProducts((prev) =>
                            prev.filter((id) => !filteredProducts.some((p: unknown) => p.id === id)),
                          );
                        } else {
                          setSelectedProducts((prev) => [
                            ...new Set([...prev, ...filteredProducts.map((p: unknown) => p.id)]),
                          ]);
                        }
                      }}
                      className="h-5 w-5"
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('product_name')}>
                    <div className="flex items-center">
                      Product
                      <SortIcon field="product_name" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('sku')}>
                    <div className="flex items-center">
                      SKU
                      <SortIcon field="sku" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('subcategory_id')}>
                    <div className="flex items-center">
                      Level 2
                      <SortIcon field="subcategory_id" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('sub_subcategory_id')}
                  >
                    <div className="flex items-center">
                      Level 3
                      <SortIcon field="sub_subcategory_id" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('sub_sub_subcategory_id')}
                  >
                    <div className="flex items-center">
                      Level 4
                      <SortIcon field="sub_sub_subcategory_id" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('brand_name')}>
                    <div className="flex items-center">
                      Brand
                      <SortIcon field="brand_name" />
                    </div>
                  </TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('starting_price')}>
                    <div className="flex items-center">
                      Price
                      <SortIcon field="starting_price" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-center hover:bg-muted/50"
                    onClick={() => handleSort('custom_opts')}
                  >
                    <div className="flex items-center justify-center">
                      Custom Opts
                      <SortIcon field="custom_opts" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <p>No products found matching your filters.</p>
                        <p className="text-sm">Try adjusting your filter selections above.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product: unknown) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setEditingProduct(product)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleSelectProduct(product.id)}
                          className="h-5 w-5"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.thumbnail && (
                            <img
                              src={product.thumbnail}
                              alt={product.product_name}
                              className="h-12 min-h-[48px] w-12 min-w-[48px] rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{product.product_name}</p>
                            {product.product_description && (
                              <p className="line-clamp-1 text-xs text-muted-foreground">
                                {product.product_description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-muted-foreground">{product.sku || '-'}</span>
                      </TableCell>
                      <TableCell>{product.product_subcategories?.name || '-'}</TableCell>
                      <TableCell>{product.product_sub_subcategories?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.product_sub_sub_subcategories?.name && (
                            <Badge variant="outline" className="text-xs">
                              {product.product_sub_sub_subcategories.name}
                            </Badge>
                          )}
                          {product.additionalLevel4Categories?.map((cat: unknown) => (
                            <Badge key={cat.id} variant="secondary" className="text-xs">
                              {cat.name}
                            </Badge>
                          ))}
                          {!product.product_sub_sub_subcategories?.name &&
                            (!product.additionalLevel4Categories || product.additionalLevel4Categories.length === 0) &&
                            '-'}
                        </div>
                      </TableCell>
                      <TableCell>{product.brands?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.tags && product.tags.length > 0 ? (
                            product.tags.map((tag: unknown) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: tag.color || 'hsl(var(--secondary))',
                                  color: 'white',
                                }}
                              >
                                {tag.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">£{Number(product.starting_price).toFixed(2)}</p>
                          {product.discounted_price && (
                            <p className="text-xs text-green-600">
                              Sale: £{Number(product.discounted_price).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const customCount = customAttributeCounts.get(product.id) || 0;
                          return customCount > 0 ? (
                            <Badge
                              variant="outline"
                              className="border-destructive/20 bg-destructive/10 font-semibold text-destructive"
                            >
                              {customCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-accent">
                                <div
                                  className={`h-3 w-3 rounded-full ${
                                    product.status === 'published'
                                      ? 'bg-green-500'
                                      : product.status === 'draft'
                                        ? 'bg-warning'
                                        : 'bg-red-500'
                                  }`}
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="z-50 border bg-background shadow-md">
                              <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'published')}>
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full bg-green-500" />
                                  <span>Published</span>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'draft')}>
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full bg-warning" />
                                  <span>Draft</span>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'private')}>
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full bg-red-500" />
                                  <span>Private</span>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {product.is_marketplace_listed && (
                            <Badge variant="outline" className="text-xs">
                              Marketplace
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const productUrl = product.slug || product.id;
                              window.open(`/product/${productUrl}`, '_blank');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDuplicate(product.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleArchive(product.id, product.archived)}>
                                {product.archived ? (
                                  <>
                                    <ArchiveRestore className="mr-2 h-4 w-4" />
                                    Unarchive
                                  </>
                                ) : (
                                  <>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </Card>

      {editingProduct && (
        <ProductEditModal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={() => {
            setEditingProduct(null);
            queryClient.invalidateQueries({ queryKey: ['master-products-paginated'] });
          }}
          product={editingProduct}
          sellerId={systemSellerId}
        />
      )}
    </>
  );
};
