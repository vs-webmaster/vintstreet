import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchBlogTags, createBlogTag, updateBlogTag, deleteBlogTag } from '@/services/blog';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

export default function AdminBlogTagsPage() {
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<any>(null);
  const [deleteTag, setDeleteTag] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['admin-blog-tags'],
    queryFn: async () => {
      const result = await fetchBlogTags();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await createBlogTag({ name });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-tags'] });
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
      setNewTagName('');
      toast.success('Tag created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create tag: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const result = await updateBlogTag(id, { name });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-tags'] });
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
      setEditingTag(null);
      toast.success('Tag updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update tag: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBlogTag(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-tags'] });
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
      setDeleteTag(null);
      toast.success('Tag deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete tag: ' + error.message);
    },
  });

  const handleCreate = () => {
    if (!newTagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }
    createMutation.mutate(newTagName.trim());
  };

  const handleUpdate = () => {
    if (!editingTag?.name?.trim()) {
      toast.error('Please enter a tag name');
      return;
    }
    updateMutation.mutate({ id: editingTag.id, name: editingTag.name.trim() });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/admin/blog">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Blog Tags</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {createMutation.isPending ? 'Creating...' : 'Create Tag'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Tags ({tags.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">Loading tags...</div>
            ) : tags.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No tags yet. Create your first tag above.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag: any) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        {editingTag?.id === tag.id ? (
                          <Input
                            value={editingTag.name}
                            onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                          />
                        ) : (
                          tag.name
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(tag.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingTag?.id === tag.id ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingTag(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="outline" onClick={() => setEditingTag(tag)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline" onClick={() => setDeleteTag(tag)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteTag} onOpenChange={() => setDeleteTag(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tag</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteTag?.name}"? This will remove it from all blog posts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTag && deleteMutation.mutate(deleteTag.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
