import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MultiSelectAttributeProps {
  attribute: any;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export const MultiSelectAttribute = ({ attribute, selectedValues, onChange }: MultiSelectAttributeProps) => {
  const [open, setOpen] = useState(false);
  const options = attribute.attribute_options?.filter((opt: any) => opt.is_active) || [];

  // Check which selected values are custom (not in approved options)
  const customValues = Array.isArray(selectedValues)
    ? selectedValues.filter((val) => !options.some((opt: any) => opt.value === val))
    : [];

  const handleSelect = (value: string) => {
    const currentValues = Array.isArray(selectedValues) ? selectedValues : [];
    if (currentValues.includes(value)) {
      onChange(currentValues.filter((v) => v !== value));
    } else {
      onChange([...currentValues, value]);
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background"
          >
            {selectedValues.length > 0 ? `${selectedValues.length} selected` : `Select ${attribute.name.toLowerCase()}`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-[100] w-full border border-border bg-popover p-0 shadow-lg" align="start">
          <Command className="bg-popover">
            <CommandInput placeholder={`Search ${attribute.name.toLowerCase()}...`} className="bg-popover" />
            <CommandList className="bg-popover">
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup className="bg-popover">
                {options.map((option: any) => (
                  <CommandItem
                    key={option.id}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedValues.includes(option.value) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {option.value}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedValues.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedValues.map((value: string, idx: number) => {
            const isCustom = customValues.includes(value);
            return (
              <Badge
                key={idx}
                variant="secondary"
                className={cn(
                  'cursor-pointer hover:bg-destructive/20',
                  isCustom && 'border border-destructive/20 bg-destructive/10 text-destructive',
                )}
                onClick={() => {
                  const newValues = selectedValues.filter((v: string) => v !== value);
                  onChange(newValues);
                }}
              >
                {value}
                {isCustom && <span className="ml-1 text-[10px] opacity-70">(Custom)</span>}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
