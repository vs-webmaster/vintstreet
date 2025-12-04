import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchShopBannersAdmin,
  createShopBanner,
  updateShopBanner,
  deleteShopBanner,
  reorderShopBanner,
} from '@/services/shop';
import { uploadFile } from '@/services/storage';
import { isFailure } from '@/types/api';

interface ShopBanner {
  id: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const BannersTab = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<ShopBanner | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    button_text: '',
    button_link: '',
    image_url: '',
    is_active: true,
    rotation_interval: 6,
    button_bg_color: '#000000',
    button_text_color: '#FFFFFF',
  });

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['shop-banners'],
    queryFn: async () => {
      const result = await fetchShopBannersAdmin();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
  });

  const createBanner = useMutation({
    mutationFn: async (data: typeof formData) => {
      const maxOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.display_order)) : -1;

      const result = await createShopBanner({
        ...data,
        display_order: maxOrder + 1,
      });

      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-banners'] });
      toast.success('Banner created successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create banner: ' + error.message);
    },
  });

  const updateBanner = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const result = await updateShopBanner(id, data);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-banners'] });
      toast.success('Banner updated successfully');
      setIsEditOpen(false);
      setEditingBanner(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update banner: ' + error.message);
    },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteShopBanner(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-banners'] });
      toast.success('Banner deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete banner: ' + error.message);
    },
  });

  const reorderBanner = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const result = await reorderShopBanner(id, newOrder);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-banners'] });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (!user) {
        throw new Error('You must be logged in to upload images');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      // Include user ID in path to satisfy RLS policies
      const result = await uploadFile(file, {
        bucket: 'product-images',
        pathPrefix: `${user.id}/banners`,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      setFormData((prev) => ({ ...prev, image_url: result.data.url }));
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      button_text: '',
      button_link: '',
      image_url: '',
      is_active: true,
      rotation_interval: 6,
      button_bg_color: '#000000',
      button_text_color: '#FFFFFF',
    });
  };

  const handleEdit = (banner: ShopBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      button_text: banner.button_text || '',
      button_link: banner.button_link || '',
      image_url: banner.image_url,
      is_active: banner.is_active,
      rotation_interval: (banner as any).rotation_interval || 6,
      button_bg_color: (banner as any).button_bg_color || '#000000',
      button_text_color: (banner as any).button_text_color || '#FFFFFF',
    });
    setIsEditOpen(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const banner1 = banners[index];
    const banner2 = banners[index - 1];

    reorderBanner.mutate({ id: banner1.id, newOrder: banner2.display_order });
    reorderBanner.mutate({ id: banner2.id, newOrder: banner1.display_order });
  };

  const handleMoveDown = (index: number) => {
    if (index === banners.length - 1) return;
    const banner1 = banners[index];
    const banner2 = banners[index + 1];

    reorderBanner.mutate({ id: banner1.id, newOrder: banner2.display_order });
    reorderBanner.mutate({ id: banner2.id, newOrder: banner1.display_order });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shop Banners</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter banner title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter banner description"
                />
              </div>
              <div>
                <Label htmlFor="button_text">Button Text</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData((prev) => ({ ...prev, button_text: e.target.value }))}
                  placeholder="e.g., Shop Now"
                />
              </div>
              <div>
                <Label htmlFor="button_link">Button Link</Label>
                <Input
                  id="button_link"
                  value={formData.button_link}
                  onChange={(e) => setFormData((prev) => ({ ...prev, button_link: e.target.value }))}
                  placeholder="e.g., /shop/category-slug"
                />
              </div>
              <div>
                <Label htmlFor="image">Banner Image</Label>
                <div className="flex items-center gap-2">
                  <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {formData.image_url && (
                  <img src={formData.image_url} alt="Preview" className="mt-2 h-32 rounded object-cover" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rotation_interval">Rotation Interval (seconds)</Label>
                  <Input
                    id="rotation_interval"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.rotation_interval}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, rotation_interval: parseInt(e.target.value) || 6 }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <Label>Button Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.button_bg_color}
                        onChange={(e) => setFormData((prev) => ({ ...prev, button_bg_color: e.target.value }))}
                        className="h-10 w-16 cursor-pointer p-1"
                      />
                      <Input
                        type="text"
                        value={formData.button_bg_color}
                        onChange={(e) => setFormData((prev) => ({ ...prev, button_bg_color: e.target.value }))}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label>Button Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.button_text_color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, button_text_color: e.target.value }))}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input
                    type="text"
                    value={formData.button_text_color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, button_text_color: e.target.value }))}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                />
                <Label>Active</Label>
              </div>
              <Button
                onClick={() => createBanner.mutate(formData)}
                disabled={!formData.title || !formData.image_url || createBanner.isPending}
                className="w-full"
              >
                {createBanner.isPending ? 'Creating...' : 'Create Banner'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">Loading banners...</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Manage Banners</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Button</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner, index) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === banners.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <img src={banner.image_url} alt={banner.title} className="h-16 w-24 rounded object-cover" />
                    </TableCell>
                    <TableCell>{banner.title}</TableCell>
                    <TableCell>
                      {banner.button_text && banner.button_link ? (
                        <span className="text-sm">{banner.button_text}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={(checked) =>
                          updateBanner.mutate({ id: banner.id, data: { is_active: checked } })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(banner)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this banner?')) {
                              deleteBanner.mutate(banner.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-button-text">Button Text</Label>
              <Input
                id="edit-button-text"
                value={formData.button_text}
                onChange={(e) => setFormData((prev) => ({ ...prev, button_text: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-button-link">Button Link</Label>
              <Input
                id="edit-button-link"
                value={formData.button_link}
                onChange={(e) => setFormData((prev) => ({ ...prev, button_link: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-image">Banner Image</Label>
              <div className="flex items-center gap-2">
                <Input id="edit-image" type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {formData.image_url && (
                <img src={formData.image_url} alt="Preview" className="mt-2 h-32 rounded object-cover" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-rotation-interval">Rotation Interval (seconds)</Label>
                <Input
                  id="edit-rotation-interval"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.rotation_interval}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, rotation_interval: parseInt(e.target.value) || 6 }))
                  }
                />
              </div>
              <div className="flex items-end">
                <div className="w-full">
                  <Label>Button Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.button_bg_color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, button_bg_color: e.target.value }))}
                      className="h-10 w-16 cursor-pointer p-1"
                    />
                    <Input
                      type="text"
                      value={formData.button_bg_color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, button_bg_color: e.target.value }))}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label>Button Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.button_text_color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, button_text_color: e.target.value }))}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <Input
                  type="text"
                  value={formData.button_text_color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, button_text_color: e.target.value }))}
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
            <Button
              onClick={() =>
                editingBanner &&
                updateBanner.mutate({
                  id: editingBanner.id,
                  data: formData,
                })
              }
              disabled={!formData.title || !formData.image_url || updateBanner.isPending}
              className="w-full"
            >
              {updateBanner.isPending ? 'Updating...' : 'Update Banner'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
