import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchGuides } from '@/services/guides';
import { isFailure } from '@/types/api';

interface CategoryGuideSelectorProps {
  sizeGuideId?: string;
  gradingGuideId?: string;
  onSizeGuideChange: (value: string) => void;
  onGradingGuideChange: (value: string) => void;
}

const CategoryGuideSelector = ({
  sizeGuideId,
  gradingGuideId,
  onSizeGuideChange,
  onGradingGuideChange,
}: CategoryGuideSelectorProps) => {
  const { data: sizeGuides = [] } = useQuery({
    queryKey: ['size-guides'],
    queryFn: async () => {
      const result = await fetchGuides('size_guides');
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: gradingGuides = [] } = useQuery({
    queryKey: ['grading-guides'],
    queryFn: async () => {
      const result = await fetchGuides('grading_guides');
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Size Guide (Optional)</Label>
        <Select value={sizeGuideId || 'none'} onValueChange={onSizeGuideChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a size guide" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {sizeGuides.map((guide: unknown) => (
              <SelectItem key={guide.id} value={guide.id}>
                {guide.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Grading Guide (Optional)</Label>
        <Select value={gradingGuideId || 'none'} onValueChange={onGradingGuideChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a grading guide" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {gradingGuides.map((guide: unknown) => (
              <SelectItem key={guide.id} value={guide.id}>
                {guide.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CategoryGuideSelector;
