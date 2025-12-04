import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { fetchBlogTags, createBlogTag } from '@/services/blog';
import { isSuccess } from '@/types/api';

interface BlogTagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const BlogTagSelector = ({ selectedTags, onTagsChange }: BlogTagSelectorProps) => {
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: tags = [] } = useQuery({
    queryKey: ['blog-tags'],
    queryFn: async () => {
      const result = await fetchBlogTags();
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await createBlogTag({ name });
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
      onTagsChange([...selectedTags, data.id]);
      setNewTagName('');
      setIsCreating(false);
      toast.success('Tag created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create tag: ' + (error?.message || 'Unknown error'));
    },
  });

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }
    createTagMutation.mutate(newTagName.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new tag */}
        {!isCreating ? (
          <Button variant="outline" size="sm" onClick={() => setIsCreating(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create New Tag
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
            />
            <Button size="sm" onClick={handleCreateTag} disabled={createTagMutation.isPending}>
              {createTagMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setNewTagName('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Existing tags */}
        {tags.length === 0 ? (
          <div className="text-sm text-muted-foreground">No tags available. Create your first tag above.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: any) => (
              <div key={tag.id} onClick={() => toggleTag(tag.id)} className="cursor-pointer">
                <Badge
                  variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                  className="transition-colors hover:bg-primary/80"
                >
                  <Checkbox
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                    className="mr-2"
                  />
                  {tag.name}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
