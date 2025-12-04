import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Upload, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BulkBrandUpload } from '@/components/BulkBrandUpload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  fetchBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandActive,
  toggleBrandPopular,
} from '@/services/brands';
import { uploadBrandLogo } from '@/services/storage';
import { isFailure } from '@/types/api';

interface Brand {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export const BrandsTab = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
  });

  const {
    data: brands = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['brands-admin'],
    queryFn: async () => {
      const result = await fetchBrands({});
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
  });

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return null;
    }

    setUploadingLogo(true);
    try {
      const uploadResult = await uploadBrandLogo(file);

      if (isFailure(uploadResult)) {
        throw uploadResult.error;
      }

      return uploadResult.data.url;
    } catch (error) {
      toast.error('Failed to upload logo');
      console.error(error);
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    const result = await createBrand({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      logo_url: formData.logo_url.trim() || null,
      is_active: true,
    });

    if (isFailure(result)) {
      toast.error('Failed to create brand');
      console.error(result.error);
      return;
    }

    toast.success('Brand created successfully');
    setFormData({ name: '', description: '', logo_url: '' });
    setIsCreateOpen(false);
    refetch();
  };

  const handleEdit = async () => {
    if (!editingBrand || !formData.name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    const result = await updateBrand(editingBrand.id, {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      logo_url: formData.logo_url.trim() || null,
    });

    if (isFailure(result)) {
      toast.error('Failed to update brand');
      console.error(result.error);
      return;
    }

    toast.success('Brand updated successfully');
    setEditingBrand(null);
    setFormData({ name: '', description: '', logo_url: '' });
    setIsEditOpen(false);
    refetch();
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;

    const result = await deleteBrand(brandId);

    if (isFailure(result)) {
      toast.error('Failed to delete brand');
      console.error(result.error);
      return;
    }

    toast.success('Brand deleted successfully');
    refetch();
  };

  const toggleActive = async (brand: Brand) => {
    const result = await toggleBrandActive(brand.id);

    if (isFailure(result)) {
      toast.error('Failed to update brand status');
      console.error(result.error);
      return;
    }

    toast.success(`Brand ${!brand.is_active ? 'activated' : 'deactivated'}`);
    refetch();
  };

  const togglePopular = async (brand: Brand) => {
    const result = await toggleBrandPopular(brand.id);

    if (isFailure(result)) {
      toast.error('Failed to update popular status');
      console.error(result.error);
      return;
    }

    toast.success(`Brand ${!brand.is_popular ? 'marked as popular' : 'unmarked as popular'}`);
    refetch();
  };

  const openEditDialog = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      logo_url: brand.logo_url || '',
    });
    setIsEditOpen(true);
  };

  const filteredBrands = brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Brand Management</CardTitle>
              <CardDescription>Manage product brands in your marketplace</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsBulkUploadOpen(true)} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Brand
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Brand</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Brand Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter brand name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter brand description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="logo">Brand Logo</Label>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleLogoUpload(file);
                            if (url) {
                              setFormData({ ...formData, logo_url: url });
                            }
                          }
                        }}
                        disabled={uploadingLogo}
                      />
                      {uploadingLogo && <p className="mt-1 text-sm text-muted-foreground">Uploading...</p>}
                      {formData.logo_url && (
                        <div className="mt-2">
                          <img
                            src={formData.logo_url}
                            alt="Logo preview"
                            className="h-20 w-20 rounded border object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreate}>Create Brand</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search brands by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading brands...</div>
          ) : filteredBrands.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery
                ? 'No brands match your search.'
                : 'No brands found. Create your first brand to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Popular</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {brand.description || <span className="text-muted-foreground">No description</span>}
                    </TableCell>
                    <TableCell>
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="h-10 w-10 object-contain" />
                      ) : (
                        <span className="text-sm text-muted-foreground">No logo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={brand.is_active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleActive(brand as Brand)}
                      >
                        {brand.is_active ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={brand.is_popular ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => togglePopular(brand as Brand)}
                      >
                        {brand.is_popular ? 'Popular' : 'Regular'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(brand.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(brand as Brand)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(brand.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Brand Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter brand name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter brand description"
              />
            </div>
            <div>
              <Label htmlFor="edit-logo">Brand Logo</Label>
              <Input
                id="edit-logo"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await handleLogoUpload(file);
                    if (url) {
                      setFormData({ ...formData, logo_url: url });
                    }
                  }
                }}
                disabled={uploadingLogo}
              />
              {uploadingLogo && <p className="mt-1 text-sm text-muted-foreground">Uploading...</p>}
              {formData.logo_url && (
                <div className="mt-2">
                  <img src={formData.logo_url} alt="Logo preview" className="h-20 w-20 rounded border object-contain" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <BulkBrandUpload isOpen={isBulkUploadOpen} onClose={() => setIsBulkUploadOpen(false)} onBrandsAdded={refetch} />
    </div>
  );
};
