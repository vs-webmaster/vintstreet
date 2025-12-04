import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Tag, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { fetchCategories } from '@/services/categories';
import {
  fetchTags,
  fetchTagDetailsWithProducts,
  createTag,
  updateTag,
  deleteTag,
  type Tag as TagType,
} from '@/services/tags';
import { isSuccess, isFailure } from '@/types/api';

export const TagsTab = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    is_featured: false,
    category_id: null as string | null,
  });

  const queryClient = useQueryClient();

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const result = await fetchCategories();
      if (isSuccess(result)) {
        return result.data.map((cat) => ({ id: cat.id, name: cat.name }));
      }
      throw result.error;
    },
  });

  const { data: tags, isLoading } = useQuery({
    queryKey: ['product-tags'],
    queryFn: async () => {
      const result = await fetchTags({});
      if (isSuccess(result)) {
        return result.data.sort((a, b) => a.name.localeCompare(b.name));
      }
      throw result.error;
    },
  });

  const { data: tagDetails } = useQuery({
    queryKey: ['product-tag-details', selectedTag],
    enabled: !!selectedTag,
    queryFn: async () => {
      if (!selectedTag) return null;
      const result = await fetchTagDetailsWithProducts(selectedTag);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.name.toLowerCase().replace(/\s+/g, '-');
      const result = await createTag({
        name: data.name,
        slug,
        description: data.description || null,
        color: data.color,
        is_featured: data.is_featured,
        category_id: data.category_id,
      });
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
      toast.success('Tag created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create tag');
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const slug = data.name.toLowerCase().replace(/\s+/g, '-');
      const result = await updateTag(id, {
        name: data.name,
        slug,
        description: data.description || null,
        color: data.color,
        is_featured: data.is_featured,
        category_id: data.category_id,
      });
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
      queryClient.invalidateQueries({ queryKey: ['product-tag-details'] });
      toast.success('Tag updated successfully');
      setEditingTag(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update tag');
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTag(id);
      if (isFailure(result)) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
      queryClient.invalidateQueries({ queryKey: ['product-tag-details'] });
      toast.success('Tag deleted successfully');
      if (selectedTag) setSelectedTag(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete tag');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#6366f1', is_featured: false, category_id: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTag) {
      updateTagMutation.mutate({ id: editingTag.id, data: formData });
    } else {
      createTagMutation.mutate(formData);
    }
  };

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color || '#6366f1',
      is_featured: tag.is_featured || false,
      category_id: tag.category_id,
    });
  };

  if (isLoading) {
    return <div className="p-6">Loading tags...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Product Tags</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Tag Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Halloween"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="color">Tag Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_featured" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Featured Tag
                </Label>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category (optional)</Label>
                <Select
                  value={formData.category_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? null : value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  If featured is enabled, this tag will show on shop pages for this category
                </p>
              </div>
              <Button type="submit" className="w-full">
                Create Tag
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tag Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Tag Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20"
                />
                <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-is_featured" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Featured Tag
              </Label>
              <Switch
                id="edit-is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category (optional)</Label>
              <Select
                value={formData.category_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? null : value })}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                If featured is enabled, this tag will show on shop pages for this category
              </p>
            </div>
            <Button type="submit" className="w-full">
              Update Tag
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tags List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">All Tags ({tags?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tags?.map((tag) => (
              <div
                key={tag.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                  selectedTag === tag.id ? 'border-primary bg-accent' : 'hover:bg-accent/50'
                }`}
                onClick={() => setSelectedTag(tag.id)}
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" style={{ color: tag.color }} />
                  <span className="font-medium">{tag.name}</span>
                  {tag.is_featured && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(tag);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this tag? This will remove it from all products.')) {
                        deleteTagMutation.mutate(tag.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {(!tags || tags.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">No tags created yet</p>
            )}
          </CardContent>
        </Card>

        {/* Tag Details & Products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedTag ? 'Tagged Products' : 'Select a tag to view products'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedTag && (
              <p className="py-12 text-center text-muted-foreground">
                Select a tag from the list to see its linked products
              </p>
            )}
            {selectedTag && tagDetails && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-4">
                  <Badge style={{ backgroundColor: tagDetails.color }}>{tagDetails.name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {tagDetails.product_count} {tagDetails.product_count === 1 ? 'product' : 'products'}
                  </span>
                </div>
                {tagDetails.description && <p className="text-sm text-muted-foreground">{tagDetails.description}</p>}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {tagDetails.products.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 rounded-lg border p-3">
                      {product.thumbnail && (
                        <img
                          src={product.thumbnail}
                          alt={product.product_name}
                          className="h-16 w-16 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{product.product_name}</p>
                      </div>
                    </div>
                  ))}
                  {tagDetails.products.length === 0 && (
                    <p className="col-span-2 py-8 text-center text-muted-foreground">
                      No products tagged with "{tagDetails.name}" yet
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
