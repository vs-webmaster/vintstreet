import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import {
  fetchAllContentPages,
  createContentPage,
  deleteContentPage,
  updateContentPagePublishStatus,
} from '@/services/content';
import { isSuccess, isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
  page_type: 'content' | 'product';
}

export default function AdminContentPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPage, setNewPage] = useState({
    title: '',
    slug: '',
    meta_description: '',
    page_type: 'content' as 'content' | 'product',
  });
  const [activeTab, setActiveTab] = useState<'content' | 'product'>('content');

  const { data: pages, isLoading } = useQuery({
    queryKey: ['content-pages'],
    queryFn: async () => {
      const result = await fetchAllContentPages();
      if (isFailure(result)) throw result.error;
      if (isSuccess(result)) return result.data;
      return [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (page: typeof newPage) => {
      const result = await createContentPage({
        title: page.title,
        slug: page.slug,
        meta_description: page.meta_description || null,
        page_type: page.page_type,
      });
      if (isFailure(result)) throw result.error;
      if (isSuccess(result)) return result.data;
      throw new Error('Failed to create page');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-pages'] });
      toast({
        title: 'Page created',
        description: 'Content page created successfully',
      });
      setCreateDialogOpen(false);
      setNewPage({ title: '', slug: '', meta_description: '', page_type: 'content' });
      navigate(`/admin/content/${data.id}/edit`);
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteContentPage(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-pages'] });
      toast({
        title: 'Page deleted',
        description: 'Content page deleted successfully',
      });
      setDeleteId(null);
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const result = await updateContentPagePublishStatus(id, !isPublished);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-pages'] });
      toast({
        title: 'Status updated',
        description: 'Page publish status updated successfully',
      });
    },
  });

  const handleCreateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setNewPage((prev) => ({ ...prev, slug }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Content Pages</h1>
            <p className="text-muted-foreground">Create and manage custom content pages</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Page
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            if (v === 'category-grid') {
              navigate('/admin/category-grid-images');
            } else {
              setActiveTab(v as 'content' | 'product');
            }
          }}
        >
          <TabsList>
            <TabsTrigger value="content">Content Pages</TabsTrigger>
            <TabsTrigger value="product">Product Pages</TabsTrigger>
            <TabsTrigger value="category-grid">Category Grid Images</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Pages</CardTitle>
                <CardDescription>Pages without product listings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading...</p>
                ) : pages?.filter((p) => p.page_type === 'content').length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages
                        ?.filter((p) => p.page_type === 'content')
                        .map((page) => (
                          <TableRow key={page.id}>
                            <TableCell className="font-medium">{page.title}</TableCell>
                            <TableCell>
                              <code className="text-sm">{page.slug}</code>
                            </TableCell>
                            <TableCell>
                              <Badge variant={page.is_published ? 'default' : 'secondary'}>
                                {page.is_published ? 'Published' : 'Draft'}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(page.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {page.is_published && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`/page/${page.slug}`, '_blank')}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/admin/content/${page.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    togglePublishMutation.mutate({
                                      id: page.id,
                                      isPublished: page.is_published,
                                    })
                                  }
                                >
                                  {page.is_published ? 'Unpublish' : 'Publish'}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteId(page.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <p className="mb-4 text-muted-foreground">No content pages yet</p>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Content Page
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="product" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Pages</CardTitle>
                <CardDescription>Pages with product listings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading...</p>
                ) : pages?.filter((p) => p.page_type === 'product').length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages
                        ?.filter((p) => p.page_type === 'product')
                        .map((page) => (
                          <TableRow key={page.id}>
                            <TableCell className="font-medium">{page.title}</TableCell>
                            <TableCell>
                              <code className="text-sm">{page.slug}</code>
                            </TableCell>
                            <TableCell>
                              <Badge variant={page.is_published ? 'default' : 'secondary'}>
                                {page.is_published ? 'Published' : 'Draft'}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(page.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {page.is_published && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`/page/${page.slug}`, '_blank')}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/admin/content/${page.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    togglePublishMutation.mutate({
                                      id: page.id,
                                      isPublished: page.is_published,
                                    })
                                  }
                                >
                                  {page.is_published ? 'Unpublish' : 'Publish'}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteId(page.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <p className="mb-4 text-muted-foreground">No product pages yet</p>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Product Page
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>Create a new page with custom content sections</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Page Type</Label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer p-4 transition-all ${
                    newPage.page_type === 'content' ? 'border-primary ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setNewPage((prev) => ({ ...prev, page_type: 'content' }))}
                >
                  <h4 className="mb-1 font-semibold">Content Page</h4>
                  <p className="text-sm text-muted-foreground">For informational pages without products</p>
                </Card>
                <Card
                  className={`cursor-pointer p-4 transition-all ${
                    newPage.page_type === 'product' ? 'border-primary ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setNewPage((prev) => ({ ...prev, page_type: 'product' }))}
                >
                  <h4 className="mb-1 font-semibold">Product Page</h4>
                  <p className="text-sm text-muted-foreground">For pages with product listings</p>
                </Card>
              </div>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newPage.title}
                onChange={(e) => {
                  setNewPage((prev) => ({ ...prev, title: e.target.value }));
                  handleCreateSlug(e.target.value);
                }}
                placeholder="Page title"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={newPage.slug}
                onChange={(e) => setNewPage((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="page-slug"
              />
              <p className="mt-1 text-sm text-muted-foreground">URL: /page/{newPage.slug || 'page-slug'}</p>
            </div>
            <div>
              <Label htmlFor="meta_description">Meta Description (Optional)</Label>
              <Textarea
                id="meta_description"
                value={newPage.meta_description}
                onChange={(e) => setNewPage((prev) => ({ ...prev, meta_description: e.target.value }))}
                placeholder="SEO meta description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newPage)}
              disabled={!newPage.title || !newPage.slug || createMutation.isPending}
            >
              Create & Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
