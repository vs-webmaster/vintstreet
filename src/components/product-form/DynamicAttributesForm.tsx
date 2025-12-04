import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { MultiSelectAttribute } from '@/components/MultiSelectAttribute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface DynamicAttributesFormProps {
  attributes: unknown[];
  dynamicAttributes: Record<string, any>;
  onAttributeChange: (attributeId: string, value: unknown) => void;
}

export const DynamicAttributesForm = ({
  attributes,
  dynamicAttributes,
  onAttributeChange,
}: DynamicAttributesFormProps) => {
  if (attributes.length === 0) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="mb-4 text-sm font-semibold text-muted-foreground">Category-Specific Attributes</h4>
      <div className="space-y-4">
        {attributes.map((attribute: unknown) => {
          const options = attribute.attribute_options?.filter((opt: unknown) => opt.is_active) || [];
          const hasOptions = options.length > 0;
          const selectedValues = dynamicAttributes[attribute.id] || [];

          return (
            <div key={attribute.id}>
              <Label htmlFor={attribute.id}>
                {attribute.display_label || attribute.name}
                {attribute.is_required && <span className="ml-1 text-destructive">*</span>}
              </Label>

              {attribute.data_type === 'multi-select' && hasOptions && (
                <MultiSelectAttribute
                  attribute={attribute}
                  selectedValues={Array.isArray(selectedValues) ? selectedValues : []}
                  onChange={(values) => onAttributeChange(attribute.id, values)}
                />
              )}

              {attribute.data_type === 'string' && hasOptions && (
                <>
                  <Select
                    value={dynamicAttributes[attribute.id] || ''}
                    onValueChange={(value) => onAttributeChange(attribute.id, value)}
                  >
                    <SelectTrigger
                      className={cn(
                        'bg-background',
                        dynamicAttributes[attribute.id] &&
                          !options.some((opt: unknown) => opt.value === dynamicAttributes[attribute.id]) &&
                          'border-destructive',
                      )}
                    >
                      <SelectValue
                        placeholder={`Select ${(attribute.display_label || attribute.name).toLowerCase()}`}
                      />
                    </SelectTrigger>
                    <SelectContent className="z-[100] border border-border bg-popover shadow-lg">
                      {options.map((option: unknown) => (
                        <SelectItem
                          key={option.id}
                          value={option.value}
                          className="cursor-pointer bg-popover hover:bg-accent hover:text-accent-foreground"
                        >
                          {option.value}
                        </SelectItem>
                      ))}
                      {/* Add custom value if it exists but not in options */}
                      {dynamicAttributes[attribute.id] &&
                        !options.some((opt: unknown) => opt.value === dynamicAttributes[attribute.id]) && (
                          <SelectItem
                            key="custom-value"
                            value={dynamicAttributes[attribute.id]}
                            className="cursor-pointer bg-popover hover:bg-accent hover:text-accent-foreground"
                          >
                            <div className="flex items-center gap-2">
                              {dynamicAttributes[attribute.id]}
                              <Badge
                                variant="outline"
                                className="border-destructive/20 bg-destructive/10 text-xs text-destructive"
                              >
                                Custom
                              </Badge>
                            </div>
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                  {/* Show custom value indicator below select */}
                  {dynamicAttributes[attribute.id] &&
                    !options.some((opt: unknown) => opt.value === dynamicAttributes[attribute.id]) && (
                      <p className="mt-1 text-xs text-destructive">Not in approved options</p>
                    )}
                </>
              )}

              {attribute.data_type === 'string' && !hasOptions && (
                <Input
                  id={attribute.id}
                  value={dynamicAttributes[attribute.id] || ''}
                  onChange={(e) => onAttributeChange(attribute.id, e.target.value)}
                  placeholder={`Enter ${(attribute.display_label || attribute.name).toLowerCase()}`}
                  required={attribute.is_required}
                />
              )}

              {attribute.data_type === 'textarea' && (
                <Textarea
                  id={attribute.id}
                  value={dynamicAttributes[attribute.id] || ''}
                  onChange={(e) => onAttributeChange(attribute.id, e.target.value)}
                  placeholder={`Enter ${(attribute.display_label || attribute.name).toLowerCase()}`}
                  required={attribute.is_required}
                  rows={4}
                />
              )}

              {attribute.data_type === 'number' && (
                <Input
                  id={attribute.id}
                  type="number"
                  step="0.01"
                  value={dynamicAttributes[attribute.id] || ''}
                  onChange={(e) => onAttributeChange(attribute.id, e.target.value)}
                  placeholder={`Enter ${(attribute.display_label || attribute.name).toLowerCase()}`}
                  required={attribute.is_required}
                />
              )}

              {attribute.data_type === 'boolean' && (
                <div className="mt-2 flex items-center space-x-2">
                  <Checkbox
                    id={attribute.id}
                    checked={dynamicAttributes[attribute.id] || false}
                    onCheckedChange={(checked) => onAttributeChange(attribute.id, checked)}
                  />
                  <Label htmlFor={attribute.id} className="font-normal">
                    Yes
                  </Label>
                </div>
              )}

              {attribute.data_type === 'date' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dynamicAttributes[attribute.id] && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dynamicAttributes[attribute.id] ? (
                        format(new Date(dynamicAttributes[attribute.id]), 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-[100] w-auto border border-border bg-popover p-0 shadow-lg"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={dynamicAttributes[attribute.id] ? new Date(dynamicAttributes[attribute.id]) : undefined}
                      onSelect={(date) => onAttributeChange(attribute.id, date?.toISOString())}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
