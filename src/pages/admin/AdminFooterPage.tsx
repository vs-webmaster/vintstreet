import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { fetchAllContentPages } from '@/services/content';
import {
  fetchFooterColumns,
  fetchFooterLinks,
  createFooterColumn,
  deleteFooterColumn,
  createFooterLink,
  deleteFooterLink,
} from '@/services/footer';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

interface FooterColumn {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
}

interface FooterLink {
  id: string;
  column_id: string;
  label: string;
  url: string;
  display_order: number;
  is_active: boolean;
}

export default function AdminFooterPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);
  const [columnForm, setColumnForm] = useState({ title: '' });
  const [linkForm, setLinkForm] = useState({ label: '', url: '' });
  const [selectedPageId, setSelectedPageId] = useState<string>('');

  const { data: columns = [] } = useQuery({
    queryKey: ['footer-columns'],
    queryFn: async () => {
      const result = await fetchFooterColumns();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: links = [] } = useQuery({
    queryKey: ['footer-links'],
    queryFn: async () => {
      const result = await fetchFooterLinks();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: contentPages = [] } = useQuery({
    queryKey: ['content-pages-list'],
    queryFn: async () => {
      const result = await fetchAllContentPages();
      if (isFailure(result)) throw result.error;
      return result.data
        .filter((page) => page.is_published)
        .map((page) => ({ id: page.id, title: page.title, slug: page.slug }));
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: async (title: string) => {
      const maxOrder = columns.length > 0 ? Math.max(...columns.map((c) => c.display_order)) : -1;
      const result = await createFooterColumn({
        title,
        display_order: maxOrder + 1,
      });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-columns'] });
      setShowColumnDialog(false);
      setColumnForm({ title: '' });
      toast({ title: 'Success', description: 'Column created successfully' });
    },
  });

  const createLinkMutation = useMutation({
    mutationFn: async ({ column_id, label, url }: { column_id: string; label: string; url: string }) => {
      const columnLinks = links.filter((l) => l.column_id === column_id);
      const maxOrder = columnLinks.length > 0 ? Math.max(...columnLinks.map((l) => l.display_order)) : -1;
      const result = await createFooterLink({
        column_id,
        label,
        url,
        display_order: maxOrder + 1,
      });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-links'] });
      setShowLinkDialog(false);
      setLinkForm({ label: '', url: '' });
      toast({ title: 'Success', description: 'Link created successfully' });
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFooterColumn(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-columns'] });
      queryClient.invalidateQueries({ queryKey: ['footer-links'] });
      setDeleteColumnId(null);
      toast({ title: 'Success', description: 'Column deleted successfully' });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFooterLink(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-links'] });
      setDeleteLinkId(null);
      toast({ title: 'Success', description: 'Link deleted successfully' });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Footer Management</h1>
          <Dialog open={showColumnDialog} onOpenChange={setShowColumnDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Column
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Footer Column</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Column Title</Label>
                  <Input
                    value={columnForm.title}
                    onChange={(e) => setColumnForm({ title: e.target.value })}
                    placeholder="e.g., Help"
                  />
                </div>
                <Button onClick={() => createColumnMutation.mutate(columnForm.title)} disabled={!columnForm.title}>
                  Create Column
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {columns.map((column) => {
            const columnLinks = links.filter((l) => l.column_id === column.id);
            return (
              <Card key={column.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>{column.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedColumn(column.id);
                          setShowLinkDialog(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Link
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteColumnId(column.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {columnLinks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No links added yet</p>
                    ) : (
                      columnLinks.map((link) => (
                        <div key={link.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{link.label}</p>
                            <p className="text-sm text-muted-foreground">{link.url}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteLinkId(link.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog
          open={showLinkDialog}
          onOpenChange={(open) => {
            setShowLinkDialog(open);
            if (!open) {
              setLinkForm({ label: '', url: '' });
              setSelectedPageId('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Link</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Add Link</TabsTrigger>
                <TabsTrigger value="page">Select Page</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div>
                  <Label>Link Label</Label>
                  <Input
                    value={linkForm.label}
                    onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })}
                    placeholder="e.g., Contact Us"
                  />
                </div>
                <div>
                  <Label>Link URL</Label>
                  <Input
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    placeholder="e.g., /contact or https://example.com"
                  />
                </div>
                <Button
                  onClick={() =>
                    selectedColumn &&
                    createLinkMutation.mutate({
                      column_id: selectedColumn,
                      label: linkForm.label,
                      url: linkForm.url,
                    })
                  }
                  disabled={!linkForm.label || !linkForm.url}
                >
                  Add Link
                </Button>
              </TabsContent>

              <TabsContent value="page" className="space-y-4">
                <div>
                  <Label>Select Content Page</Label>
                  <Select
                    value={selectedPageId}
                    onValueChange={(value) => {
                      setSelectedPageId(value);
                      const page = contentPages.find((p) => p.id === value);
                      if (page) {
                        setLinkForm({
                          label: page.title,
                          url: `/page/${page.slug}`,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a page..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contentPages.map((page: any) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPageId && (
                  <>
                    <div>
                      <Label>Link Label (editable)</Label>
                      <Input
                        value={linkForm.label}
                        onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })}
                        placeholder="Link label"
                      />
                    </div>
                    <div>
                      <Label>Generated URL</Label>
                      <Input value={linkForm.url} disabled className="bg-muted" />
                    </div>
                    <Button
                      onClick={() =>
                        selectedColumn &&
                        createLinkMutation.mutate({
                          column_id: selectedColumn,
                          label: linkForm.label,
                          url: linkForm.url,
                        })
                      }
                      disabled={!linkForm.label || !linkForm.url}
                    >
                      Add Link
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteColumnId} onOpenChange={() => setDeleteColumnId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Column</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the column and all its links. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteColumnId && deleteColumnMutation.mutate(deleteColumnId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleteLinkId} onOpenChange={() => setDeleteLinkId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Link</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this link? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteLinkId && deleteLinkMutation.mutate(deleteLinkId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
