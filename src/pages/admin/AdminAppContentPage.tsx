import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Trash2, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { BlogImageUpload } from '@/components/blog/BlogImageUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminLayout } from './AdminLayout';
import {
  fetchCarouselItems,
  fetchGridContent,
  fetchGridImages,
  fetchBrandsContent,
  fetchFeaturedContent,
  fetchFeaturedImages,
  fetchLinks,
  createCarouselItem,
  updateCarouselItem,
  deleteCarouselItem,
  saveGridContent,
  createGridImage,
  updateGridImage,
  deleteGridImage,
  saveBrandsContent,
  saveFeaturedContent,
  createFeaturedImage,
  updateFeaturedImage,
  deleteFeaturedImage,
  createLink,
  updateLink,
  deleteLink,
} from '@/services/appContent';
import { isFailure } from '@/types/api';

interface CarouselItem {
  id: string;
  image_url: string;
  text: string;
  link: string;
  display_order: number;
}

interface GridImage {
  id: string;
  image_url: string;
  link: string;
  display_order: number;
}

interface FeaturedImage {
  id: string;
  image_url: string;
  link: string;
  display_order: number;
}

interface LinkItem {
  id: string;
  text: string;
  link: string;
  display_order: number;
}

export default function AdminAppContentPage() {
  const queryClient = useQueryClient();

  // Section 1: Carousel
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [newCarousel, setNewCarousel] = useState({ image_url: '', text: '', link: '' });
  const [editingCarouselId, setEditingCarouselId] = useState<string | null>(null);
  const [editCarouselData, setEditCarouselData] = useState<Partial<CarouselItem>>({});

  // Section 2: Grid
  const [gridTitle, setGridTitle] = useState('');
  const [gridImages, setGridImages] = useState<GridImage[]>([]);
  const [newGridImage, setNewGridImage] = useState({ image_url: '', link: '' });
  const [editingGridImageId, setEditingGridImageId] = useState<string | null>(null);
  const [editGridImageData, setEditGridImageData] = useState<Partial<GridImage>>({});

  // Section 3: Brands
  const [brandsText, setBrandsText] = useState('');

  // Section 4: Featured
  const [featuredTitle, setFeaturedTitle] = useState('');
  const [featuredImages, setFeaturedImages] = useState<FeaturedImage[]>([]);
  const [newFeaturedImage, setNewFeaturedImage] = useState({ image_url: '', link: '' });
  const [editingFeaturedImageId, setEditingFeaturedImageId] = useState<string | null>(null);
  const [editFeaturedImageData, setEditFeaturedImageData] = useState<Partial<FeaturedImage>>({});

  // Section 5: Links
  const [linkItems, setLinkItems] = useState<LinkItem[]>([]);
  const [newLink, setNewLink] = useState({ text: '', link: '' });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editLinkData, setEditLinkData] = useState<Partial<LinkItem>>({});

  // Fetch carousel items
  const { data: carouselData } = useQuery({
    queryKey: ['app-carousel'],
    queryFn: async () => {
      const result = await fetchCarouselItems();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Fetch grid content
  const { data: gridData } = useQuery({
    queryKey: ['app-grid'],
    queryFn: async () => {
      const result = await fetchGridContent();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Fetch grid images
  const { data: gridImagesData } = useQuery({
    queryKey: ['app-grid-images'],
    queryFn: async () => {
      const result = await fetchGridImages();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Fetch brands
  const { data: brandsData } = useQuery({
    queryKey: ['app-brands'],
    queryFn: async () => {
      const result = await fetchBrandsContent();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Fetch featured content
  const { data: featuredData } = useQuery({
    queryKey: ['app-featured'],
    queryFn: async () => {
      const result = await fetchFeaturedContent();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Fetch featured images
  const { data: featuredImagesData } = useQuery({
    queryKey: ['app-featured-images'],
    queryFn: async () => {
      const result = await fetchFeaturedImages();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Fetch links
  const { data: linksData } = useQuery({
    queryKey: ['app-links'],
    queryFn: async () => {
      const result = await fetchLinks();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Sync data to state
  useEffect(() => {
    if (carouselData) setCarouselItems(carouselData as CarouselItem[]);
  }, [carouselData]);

  useEffect(() => {
    if (gridData) setGridTitle(gridData.title || '');
  }, [gridData]);

  useEffect(() => {
    if (gridImagesData) setGridImages(gridImagesData as GridImage[]);
  }, [gridImagesData]);

  useEffect(() => {
    if (brandsData) setBrandsText(brandsData.brands_list || '');
  }, [brandsData]);

  useEffect(() => {
    if (featuredData) setFeaturedTitle(featuredData.title || '');
  }, [featuredData]);

  useEffect(() => {
    if (featuredImagesData) setFeaturedImages(featuredImagesData as FeaturedImage[]);
  }, [featuredImagesData]);

  useEffect(() => {
    if (linksData) setLinkItems(linksData as LinkItem[]);
  }, [linksData]);

  // Add carousel item
  const addCarouselMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = carouselItems.length > 0 ? Math.max(...carouselItems.map((i) => i.display_order)) : 0;
      const result = await createCarouselItem({ ...newCarousel, display_order: maxOrder + 1 });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-carousel'] });
      setNewCarousel({ image_url: '', text: '', link: '' });
      toast.success('Carousel item added');
    },
  });

  // Update carousel item
  const updateCarouselMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CarouselItem> }) => {
      const result = await updateCarouselItem(id, data);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-carousel'] });
      setEditingCarouselId(null);
      setEditCarouselData({});
      toast.success('Carousel item updated');
    },
  });

  // Delete carousel item
  const deleteCarouselMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCarouselItem(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-carousel'] });
      toast.success('Carousel item deleted');
    },
  });

  // Save grid
  const saveGridMutation = useMutation({
    mutationFn: async () => {
      const result = await saveGridContent(gridTitle);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-grid'] });
      toast.success('Grid title saved');
    },
  });

  // Add grid image
  const addGridImageMutation = useMutation({
    mutationFn: async () => {
      if (gridImages.length >= 4) {
        throw new Error('Maximum 4 images allowed');
      }
      const maxOrder = gridImages.length > 0 ? Math.max(...gridImages.map((i) => i.display_order)) : 0;
      const result = await createGridImage({ ...newGridImage, display_order: maxOrder + 1 });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-grid-images'] });
      setNewGridImage({ image_url: '', link: '' });
      toast.success('Grid image added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update grid image
  const updateGridImageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GridImage> }) => {
      const result = await updateGridImage(id, data);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-grid-images'] });
      setEditingGridImageId(null);
      setEditGridImageData({});
      toast.success('Grid image updated');
    },
  });

  // Delete grid image
  const deleteGridImageMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteGridImage(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-grid-images'] });
      toast.success('Grid image deleted');
    },
  });

  // Save brands
  const saveBrandsMutation = useMutation({
    mutationFn: async () => {
      const result = await saveBrandsContent(brandsText);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-brands'] });
      toast.success('Brands list saved');
    },
  });

  // Save featured
  const saveFeaturedMutation = useMutation({
    mutationFn: async () => {
      const result = await saveFeaturedContent(featuredTitle);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-featured'] });
      toast.success('Featured title saved');
    },
  });

  // Add featured image
  const addFeaturedImageMutation = useMutation({
    mutationFn: async () => {
      if (featuredImages.length >= 8) {
        throw new Error('Maximum 8 images allowed');
      }
      const maxOrder = featuredImages.length > 0 ? Math.max(...featuredImages.map((i) => i.display_order)) : 0;
      const result = await createFeaturedImage({ ...newFeaturedImage, display_order: maxOrder + 1 });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-featured-images'] });
      setNewFeaturedImage({ image_url: '', link: '' });
      toast.success('Featured image added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update featured image
  const updateFeaturedImageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FeaturedImage> }) => {
      const result = await updateFeaturedImage(id, data);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-featured-images'] });
      setEditingFeaturedImageId(null);
      setEditFeaturedImageData({});
      toast.success('Featured image updated');
    },
  });

  // Delete featured image
  const deleteFeaturedImageMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFeaturedImage(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-featured-images'] });
      toast.success('Featured image deleted');
    },
  });

  // Add link
  const addLinkMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = linkItems.length > 0 ? Math.max(...linkItems.map((i) => i.display_order)) : 0;
      const result = await createLink({ ...newLink, display_order: maxOrder + 1 });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-links'] });
      setNewLink({ text: '', link: '' });
      toast.success('Link added');
    },
  });

  // Update link
  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LinkItem> }) => {
      const result = await updateLink(id, data);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-links'] });
      setEditingLinkId(null);
      setEditLinkData({});
      toast.success('Link updated');
    },
  });

  // Delete link
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteLink(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-links'] });
      toast.success('Link deleted');
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">App Content Management</h1>
          <p className="text-muted-foreground">Manage content for the mobile app</p>
        </div>

        {/* Section 1: Carousel */}
        <Card>
          <CardHeader>
            <CardTitle>Section 1: Carousel</CardTitle>
            <CardDescription>Add carousel items with images, text overlay, and links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {carouselItems.map((item) => (
                <div key={item.id} className="flex items-start gap-4 rounded-lg border p-4">
                  {editingCarouselId === item.id ? (
                    <div className="flex-1 space-y-4">
                      <BlogImageUpload
                        value={editCarouselData.image_url || item.image_url}
                        onChange={(url) => setEditCarouselData({ ...editCarouselData, image_url: url })}
                        label="Carousel Image"
                        id={`edit-carousel-${item.id}`}
                      />
                      <Input
                        value={editCarouselData.text ?? item.text}
                        onChange={(e) => setEditCarouselData({ ...editCarouselData, text: e.target.value })}
                        placeholder="Overlay Text"
                      />
                      <Input
                        value={editCarouselData.link ?? item.link}
                        onChange={(e) => setEditCarouselData({ ...editCarouselData, link: e.target.value })}
                        placeholder="Link"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateCarouselMutation.mutate({ id: item.id, data: editCarouselData })}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCarouselId(null);
                            setEditCarouselData({});
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {item.image_url && (
                        <img src={item.image_url} alt="Carousel" className="h-24 w-24 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.text}</p>
                        <p className="text-sm text-muted-foreground">{item.link}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCarouselId(item.id);
                            setEditCarouselData({});
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCarouselMutation.mutate(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Add New Carousel Item</h3>
              <BlogImageUpload
                value={newCarousel.image_url}
                onChange={(url) => setNewCarousel({ ...newCarousel, image_url: url })}
                label="Carousel Image"
                id="carousel-image"
              />
              <div>
                <Label htmlFor="carousel-text">Overlay Text</Label>
                <Input
                  id="carousel-text"
                  value={newCarousel.text}
                  onChange={(e) => setNewCarousel({ ...newCarousel, text: e.target.value })}
                  placeholder="Text to display over image"
                />
              </div>
              <div>
                <Label htmlFor="carousel-link">Link</Label>
                <Input
                  id="carousel-link"
                  value={newCarousel.link}
                  onChange={(e) => setNewCarousel({ ...newCarousel, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button
                onClick={() => addCarouselMutation.mutate()}
                disabled={!newCarousel.image_url || !newCarousel.text || !newCarousel.link}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Carousel Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Section 2: Image Grid (2x2)</CardTitle>
            <CardDescription>Add title and up to 4 images with links in a 2x2 grid</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="grid-title">Section Title</Label>
              <Input
                id="grid-title"
                value={gridTitle}
                onChange={(e) => setGridTitle(e.target.value)}
                placeholder="Enter section title"
              />
              <Button onClick={() => saveGridMutation.mutate()} className="mt-2">
                Save Title
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {gridImages.map((img) => (
                <div key={img.id} className="relative rounded-lg border p-2">
                  {editingGridImageId === img.id ? (
                    <div className="space-y-2">
                      <BlogImageUpload
                        value={editGridImageData.image_url || img.image_url}
                        onChange={(url) => setEditGridImageData({ ...editGridImageData, image_url: url })}
                        label="Grid Image"
                        id={`edit-grid-${img.id}`}
                      />
                      <Input
                        value={editGridImageData.link ?? img.link}
                        onChange={(e) => setEditGridImageData({ ...editGridImageData, link: e.target.value })}
                        placeholder="Link"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateGridImageMutation.mutate({ id: img.id, data: editGridImageData })}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingGridImageId(null);
                            setEditGridImageData({});
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {img.image_url && (
                        <img src={img.image_url} alt="Grid" className="h-32 w-full rounded object-cover" />
                      )}
                      <p className="mt-2 truncate text-xs text-muted-foreground">{img.link}</p>
                      <div className="absolute right-2 top-2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingGridImageId(img.id);
                            setEditGridImageData({});
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteGridImageMutation.mutate(img.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {gridImages.length < 4 && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Add Grid Image ({gridImages.length}/4)</h3>
                <BlogImageUpload
                  value={newGridImage.image_url}
                  onChange={(url) => setNewGridImage({ ...newGridImage, image_url: url })}
                  label="Grid Image"
                  id="grid-image"
                />
                <div>
                  <Label htmlFor="grid-link">Link</Label>
                  <Input
                    id="grid-link"
                    value={newGridImage.link}
                    onChange={(e) => setNewGridImage({ ...newGridImage, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <Button
                  onClick={() => addGridImageMutation.mutate()}
                  disabled={!newGridImage.image_url || !newGridImage.link}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Grid Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Brands */}
        <Card>
          <CardHeader>
            <CardTitle>Section 3: Brands List</CardTitle>
            <CardDescription>Add a text list of brands (comma or line separated)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={brandsText}
              onChange={(e) => setBrandsText(e.target.value)}
              placeholder="Enter brands list (one per line or comma separated)"
              rows={10}
            />
            <Button onClick={() => saveBrandsMutation.mutate()}>Save Brands List</Button>
          </CardContent>
        </Card>

        {/* Section 4: Featured */}
        <Card>
          <CardHeader>
            <CardTitle>Section 4: Featured Items</CardTitle>
            <CardDescription>Add title and up to 8 images with links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="featured-title">Section Title</Label>
              <Input
                id="featured-title"
                value={featuredTitle}
                onChange={(e) => setFeaturedTitle(e.target.value)}
                placeholder="Enter section title"
              />
              <Button onClick={() => saveFeaturedMutation.mutate()} className="mt-2">
                Save Title
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {featuredImages.map((img) => (
                <div key={img.id} className="relative rounded-lg border p-2">
                  {editingFeaturedImageId === img.id ? (
                    <div className="space-y-2">
                      <BlogImageUpload
                        value={editFeaturedImageData.image_url || img.image_url}
                        onChange={(url) => setEditFeaturedImageData({ ...editFeaturedImageData, image_url: url })}
                        label="Featured Image"
                        id={`edit-featured-${img.id}`}
                      />
                      <Input
                        value={editFeaturedImageData.link ?? img.link}
                        onChange={(e) => setEditFeaturedImageData({ ...editFeaturedImageData, link: e.target.value })}
                        placeholder="Link"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            updateFeaturedImageMutation.mutate({ id: img.id, data: editFeaturedImageData })
                          }
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingFeaturedImageId(null);
                            setEditFeaturedImageData({});
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {img.image_url && (
                        <img src={img.image_url} alt="Featured" className="h-24 w-full rounded object-cover" />
                      )}
                      <p className="mt-2 truncate text-xs text-muted-foreground">{img.link}</p>
                      <div className="absolute right-2 top-2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingFeaturedImageId(img.id);
                            setEditFeaturedImageData({});
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteFeaturedImageMutation.mutate(img.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {featuredImages.length < 8 && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Add Featured Image ({featuredImages.length}/8)</h3>
                <BlogImageUpload
                  value={newFeaturedImage.image_url}
                  onChange={(url) => setNewFeaturedImage({ ...newFeaturedImage, image_url: url })}
                  label="Featured Image"
                  id="featured-image"
                />
                <div>
                  <Label htmlFor="featured-link">Link</Label>
                  <Input
                    id="featured-link"
                    value={newFeaturedImage.link}
                    onChange={(e) => setNewFeaturedImage({ ...newFeaturedImage, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <Button
                  onClick={() => addFeaturedImageMutation.mutate()}
                  disabled={!newFeaturedImage.image_url || !newFeaturedImage.link}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Featured Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Text Links */}
        <Card>
          <CardHeader>
            <CardTitle>Section 5: Text & Links</CardTitle>
            <CardDescription>Manage a list of text and link pairs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {linkItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-lg border p-4">
                  {editingLinkId === item.id ? (
                    <div className="flex-1 space-y-4">
                      <Input
                        value={editLinkData.text ?? item.text}
                        onChange={(e) => setEditLinkData({ ...editLinkData, text: e.target.value })}
                        placeholder="Text"
                      />
                      <Input
                        value={editLinkData.link ?? item.link}
                        onChange={(e) => setEditLinkData({ ...editLinkData, link: e.target.value })}
                        placeholder="Link"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateLinkMutation.mutate({ id: item.id, data: editLinkData })}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingLinkId(null);
                            setEditLinkData({});
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-medium">{item.text}</p>
                        <p className="text-sm text-muted-foreground">{item.link}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingLinkId(item.id);
                            setEditLinkData({});
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteLinkMutation.mutate(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Add New Link</h3>
              <div>
                <Label htmlFor="link-text">Text</Label>
                <Input
                  id="link-text"
                  value={newLink.text}
                  onChange={(e) => setNewLink({ ...newLink, text: e.target.value })}
                  placeholder="Link text"
                />
              </div>
              <div>
                <Label htmlFor="link-url">Link URL</Label>
                <Input
                  id="link-url"
                  value={newLink.link}
                  onChange={(e) => setNewLink({ ...newLink, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button onClick={() => addLinkMutation.mutate()} disabled={!newLink.text || !newLink.link}>
                <Plus className="mr-2 h-4 w-4" />
                Add Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
