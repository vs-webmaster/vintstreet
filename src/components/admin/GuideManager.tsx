import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import GuideCategoryAssignment from '@/components/admin/GuideCategoryAssignment';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchGuides, createGuide, updateGuide, deleteGuide, type GuideTableName, type Guide } from '@/services/guides';
import { isFailure } from '@/types/api';

interface GuideManagerProps {
  tableName: 'grading_guides' | 'size_guides';
  queryKey: string;
  guideType: 'grading' | 'size';
  title: string;
  addButtonText: string;
  namePlaceholder: string;
  contentPlaceholder: string;
}

export const GuideManager = ({
  tableName,
  queryKey,
  guideType,
  title,
  addButtonText,
  namePlaceholder,
  contentPlaceholder,
}: GuideManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
<<<<<<< HEAD
  const [editingGuide, setEditingGuide] = useState<unknown>(null);
=======
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const guideLabel = guideType === 'grading' ? 'Grading guide' : 'Size guide';

  const { data: guides = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const result = await fetchGuides(tableName as GuideTableName);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newGuide: { name: string; content: string }) => {
      const result = await createGuide(tableName as GuideTableName, newGuide);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(`${guideLabel} created successfully`);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create ${guideLabel.toLowerCase()}: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (guide: { id: string; name: string; content: string }) => {
      const result = await updateGuide(tableName as GuideTableName, guide.id, {
        name: guide.name,
        content: guide.content,
      });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(`${guideLabel} updated successfully`);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update ${guideLabel.toLowerCase()}: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteGuide(tableName as GuideTableName, id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(`${guideLabel} deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete ${guideLabel.toLowerCase()}: ${error.message}`);
    },
  });

  const resetForm = () => {
    setIsAddDialogOpen(false);
    setEditingGuide(null);
    setName('');
    setContent('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGuide) {
      updateMutation.mutate({ id: editingGuide.id, name, content });
    } else {
      createMutation.mutate({ name, content });
    }
  };

  const handleEdit = (guide: unknown) => {
    setEditingGuide(guide);
    setName(guide.name);
    setContent(guide.content);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${guideLabel.toLowerCase()}?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{title}</h1>
        <Dialog open={isAddDialogOpen || !!editingGuide} onOpenChange={(open) => !open && resetForm()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {addButtonText}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGuide ? `Edit ${guideLabel}` : `Add ${guideLabel}`}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={namePlaceholder}
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <div className="mt-2">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    placeholder={contentPlaceholder}
                    className="bg-background"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ align: [] }],
                        ['link', 'image'],
                        ['clean'],
                      ],
                    }}
                  />
                </div>
              </div>

              {editingGuide && (
                <div className="border-t pt-4">
                  <GuideCategoryAssignment guideId={editingGuide.id} guideType={guideType} />
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">{editingGuide ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Content Preview</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guides.map((guide: unknown) => (
              <TableRow key={guide.id}>
                <TableCell className="font-medium">{guide.name}</TableCell>
                <TableCell className="max-w-md truncate">{guide.content.substring(0, 100)}...</TableCell>
                <TableCell>{new Date(guide.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(guide)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(guide.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
