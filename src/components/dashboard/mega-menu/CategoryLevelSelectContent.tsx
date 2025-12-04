import { SelectContent, SelectItem } from '@/components/ui/select';
import type { AvailableItemsByLevel } from './utils';

interface CategoryLevelSelectContentProps {
  availableItemsByLevel: AvailableItemsByLevel;
}

export function CategoryLevelSelectContent({ availableItemsByLevel }: CategoryLevelSelectContentProps) {
  return (
    <SelectContent>
      {availableItemsByLevel[2].length > 0 && (
        <>
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Level 2 - Subcategories
          </div>
          {availableItemsByLevel[2].map((item) => (
            <SelectItem key={`2:${item.id}`} value={`2:${item.id}`}>
              {item.name}
            </SelectItem>
          ))}
        </>
      )}
      {availableItemsByLevel[3].length > 0 && (
        <>
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Level 3 - Sub-subcategories
          </div>
          {availableItemsByLevel[3].map((item) => (
            <SelectItem key={`3:${item.id}`} value={`3:${item.id}`}>
              {item.name}
            </SelectItem>
          ))}
        </>
      )}
      {availableItemsByLevel[4].length > 0 && (
        <>
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Level 4 - Sub-sub-subcategories
          </div>
          {availableItemsByLevel[4].map((item) => (
            <SelectItem key={`4:${item.id}`} value={`4:${item.id}`}>
              {item.name}
            </SelectItem>
          ))}
        </>
      )}
    </SelectContent>
  );
}
