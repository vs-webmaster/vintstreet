import { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DynamicFilterAttribute {
  id: string;
  name: string;
  display_label: string;
  showInTopLine?: boolean;
  options: string[];
}

interface DynamicAttributeFiltersProps {
  attributeFilters: DynamicFilterAttribute[];
  selectedAttributes: Map<string, Set<string>>;
  onAttributeChange: (attributeId: string, value: string, checked: boolean) => void;
  variant?: 'horizontal' | 'sidebar';
}

export const DynamicAttributeFilters = memo(
  ({ attributeFilters, selectedAttributes, onAttributeChange, variant = 'sidebar' }: DynamicAttributeFiltersProps) => {
    if (attributeFilters.length === 0) return null;

    if (variant === 'horizontal') {
      return (
        <>
          {attributeFilters.map((attr) => {
            const selectedValues = selectedAttributes.get(attr.id) || new Set();
            
            return (
              <DropdownMenu key={attr.id}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-normal w-full justify-between">
                    {attr.display_label}
                    {selectedValues.size > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0"
                      >
                        {selectedValues.size}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-50 max-h-[400px] w-64 overflow-y-auto bg-background">
                  <div className="space-y-2 p-2">
                    {attr.options.map((option) => (
                      <div key={option} className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                        <Checkbox
                          id={`${attr.id}-${option}-horizontal`}
                          checked={selectedValues.has(option)}
                          onCheckedChange={(checked) =>
                            onAttributeChange(attr.id, option, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`${attr.id}-${option}-horizontal`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </>
      );
    }

    // Sidebar variant
    return (
      <>
        {attributeFilters.map((attr) => {
          const selectedValues = selectedAttributes.get(attr.id) || new Set();
          
          return (
            <AccordionItem key={attr.id} value={attr.id} className="border-b pb-2">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex w-full items-center justify-between pr-2">
                  <span className="text-sm font-semibold">{attr.display_label}</span>
                  {selectedValues.size > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {selectedValues.size}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-3 pt-2">
                    {attr.options.map((option) => (
                      <div key={option} className="flex items-start space-x-2">
                        <Checkbox
                          id={`${attr.id}-${option}-sidebar`}
                          checked={selectedValues.has(option)}
                          onCheckedChange={(checked) =>
                            onAttributeChange(attr.id, option, checked as boolean)
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor={`${attr.id}-${option}-sidebar`}
                          className="flex-1 cursor-pointer text-sm leading-tight"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </>
    );
  },
);

DynamicAttributeFilters.displayName = 'DynamicAttributeFilters';
