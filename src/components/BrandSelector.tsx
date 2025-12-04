import { useState } from 'react';
import { Check, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBrands, useBrand } from '@/hooks/queries/useBrands';
import { cn } from '@/lib/utils';

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  is_popular: boolean;
}

interface BrandSelectorProps {
  selectedBrandId: string | null;
  onSelectBrand: (brandId: string | null, brandName: string) => void;
}

export const BrandSelector = ({ selectedBrandId, onSelectBrand }: BrandSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: brandsData = [] } = useBrands({ isActive: true });
  const { data: selectedBrand } = useBrand(selectedBrandId);

  // Sort brands alphabetically
  const brands = brandsData.sort((a, b) => a.name.localeCompare(b.name));

  // Show only popular brands by default, all brands when searching
  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase());

    // If searching, show all matching brands
    if (searchQuery.trim()) {
      return matchesSearch;
    }

    // If not searching, show only popular brands
    return brand.is_popular && matchesSearch;
  });

  const handleSelectBrand = (brand: Brand) => {
    onSelectBrand(brand.id, brand.name);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClearBrand = () => {
    onSelectBrand(null, '');
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
          <Tag className="mr-2 h-4 w-4" />
          {selectedBrand ? (
            <div className="flex items-center gap-2">
              {selectedBrand.logo_url && (
                <img src={selectedBrand.logo_url} alt={selectedBrand.name} className="h-5 w-5 object-contain" />
              )}
              <span>{selectedBrand.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select brand (optional)</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Brand</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="space-y-1 p-2">
              {!searchQuery.trim() && (
                <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">Popular Brands</div>
              )}
              {filteredBrands.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No brands found</div>
              ) : (
                filteredBrands.map((brand) => (
                  <Button
                    key={brand.id}
                    variant="ghost"
                    className={cn(
                      'h-auto w-full justify-between px-3 py-1.5',
                      selectedBrandId === brand.id && 'bg-accent',
                    )}
                    onClick={() => handleSelectBrand(brand as Brand)}
                    type="button"
                  >
                    <span className="text-sm font-medium">{brand.name}</span>
                    {selectedBrandId === brand.id && <Check className="h-4 w-4 flex-shrink-0" />}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
