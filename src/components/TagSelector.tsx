import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTags } from '@/hooks/queries/useTags';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagSelector = ({ selectedTags, onTagsChange }: TagSelectorProps) => {
  const { data: tags = [], isLoading } = useTags({ isActive: true });

  const handleTagToggle = (tagId: string) => {
    const isSelected = selectedTags.includes(tagId);
    if (isSelected) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading tags...</div>;
  }

  if (tags.length === 0) {
    return <div className="text-sm text-muted-foreground">No tags available. Contact admin to add tags.</div>;
  }

  return (
    <div className="space-y-3">
      <Label>Tags (Optional)</Label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} onClick={() => handleTagToggle(tag.id)} className="cursor-pointer">
            <Badge
              variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
              className="transition-colors hover:bg-primary/80"
            >
              <Checkbox
                checked={selectedTags.includes(tag.id)}
                onCheckedChange={() => handleTagToggle(tag.id)}
                className="mr-2"
              />
              {tag.name}
            </Badge>
          </div>
        ))}
      </div>
      {selectedTags.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
};
