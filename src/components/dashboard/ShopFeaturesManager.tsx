import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  fetchHomepageCardWithItemsAdmin,
  upsertHomepageCard,
  deleteHomepageCardItems,
  insertHomepageCardItems,
} from '@/services/homepage';
import { uploadFile } from '@/services/storage';
import { isFailure } from '@/types/api';

interface HomepageCard {
  id: string;
  title: string | null;
  description: string | null;
}

interface HomepageCardItem {
  id: string;
  homepage_card_id: string;
  image_url: string | null;
  link: string | null;
  overlay_text: string | null;
  button_text: string | null;
  button_link: string | null;
  display_order: number;
  is_active: boolean;
}

export const ShopFeaturesManager = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Partial<HomepageCardItem>[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['homepage-cards-admin'],
    queryFn: async () => {
      const result = await fetchHomepageCardWithItemsAdmin();
      if (isFailure(result)) throw result.error;

      return {
        card: result.data.card as HomepageCard | null,
        items: result.data.items as HomepageCardItem[],
      };
    },
  });

  useEffect(() => {
    if (data) {
      setTitle(data.card?.title || '');
      setDescription(data.card?.description || '');
      setItems(data.items.length > 0 ? data.items : [createEmptyItem(0)]);
    }
  }, [data]);

  const createEmptyItem = (order: number): Partial<HomepageCardItem> => ({
    image_url: '',
    link: '',
    overlay_text: '',
    button_text: '',
    button_link: '',
    display_order: order,
    is_active: true,
  });

  const handleImageUpload = async (index: number, file: File) => {
    setUploading(index);
    try {
      const result = await uploadFile(file, {
        bucket: 'product-images',
        pathPrefix: 'homepage-cards',
      });

      if (isFailure(result)) {
        throw result.error;
      }

      const newItems = [...items];
      newItems[index] = { ...newItems[index], image_url: result.data.url };
      setItems(newItems);
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(null);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      let cardId = data?.card?.id;

      // Create or update the parent card
      const cardResult = await upsertHomepageCard(cardId || null, title, description);
      if (isFailure(cardResult)) throw cardResult.error;
      cardId = cardResult.data.id;

      // Delete existing items
      const deleteResult = await deleteHomepageCardItems(cardId);
      if (isFailure(deleteResult)) throw deleteResult.error;

      // Insert new items
      const itemsToInsert = items
        .filter((item) => item.image_url)
        .map((item, index) => ({
          homepage_card_id: cardId,
          image_url: item.image_url || null,
          link: item.link || null,
          overlay_text: item.overlay_text || null,
          button_text: item.button_text || null,
          button_link: item.button_link || null,
          display_order: index,
          is_active: true,
        }));

      if (itemsToInsert.length > 0) {
        const insertResult = await insertHomepageCardItems(itemsToInsert);
        if (isFailure(insertResult)) throw insertResult.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-cards-admin'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-cards'] });
      toast.success('Homepage cards saved successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const addItem = () => {
    setItems([...items, createEmptyItem(items.length)]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof HomepageCardItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Homepage Feature Cards</h3>
          <p className="text-sm text-muted-foreground">
            Manage the feature cards displayed on the homepage. You can add unlimited cards.
          </p>
        </div>

        {/* Section Header */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="title">Section Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Featured" />
          </div>
          <div>
            <Label htmlFor="description">Section Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>
        </div>

        {/* Card Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Card Items</Label>
            <Button onClick={addItem} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>

          {items.map((item, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Image Upload */}
                    <div>
                      <Label>Image</Label>
                      <div className="mt-1 flex items-center gap-2">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={`Card ${index + 1}`}
                            className="h-20 w-20 rounded object-cover"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(index, file);
                          }}
                          className="text-sm"
                          disabled={uploading === index}
                        />
                        {uploading === index && <span className="text-sm text-muted-foreground">Uploading...</span>}
                      </div>
                    </div>

                    {/* Link */}
                    <div>
                      <Label>Image Link</Label>
                      <Input
                        value={item.link || ''}
                        onChange={(e) => updateItem(index, 'link', e.target.value)}
                        placeholder="/shop/category"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Overlay Text */}
                    <div>
                      <Label>Overlay Text</Label>
                      <Input
                        value={item.overlay_text || ''}
                        onChange={(e) => updateItem(index, 'overlay_text', e.target.value)}
                        placeholder="70's"
                      />
                    </div>

                    {/* Button Text */}
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={item.button_text || ''}
                        onChange={(e) => updateItem(index, 'button_text', e.target.value)}
                        placeholder="Shop Now"
                      />
                    </div>

                    {/* Button Link */}
                    <div>
                      <Label>Button Link</Label>
                      <Input
                        value={item.button_link || ''}
                        onChange={(e) => updateItem(index, 'button_link', e.target.value)}
                        placeholder="/shop"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length <= 1}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
