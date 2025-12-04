import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Box, Users, Plus, Trash2, Edit, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchProductsBySeller } from '@/services/products';
import { isFailure } from '@/types/api';

interface MysteryBox {
  id: string;
  name: string;
  boxCount: number;
  createdAt: Date;
}

interface Giveaway {
  id: string;
  title: string;
  description: string;
  duration: number;
  createdAt: Date;
}

interface ShowTemplate {
  id: string;
  title: string;
  description: string;
  icon: unknown;
  category: string;
  popularity: number;
}

const SHOW_TEMPLATES: ShowTemplate[] = [
  {
    id: 'mystery-box',
    title: 'Mystery Box',
    description: "Create excitement with mystery box giveaways. Let viewers guess what's inside!",
    icon: Box,
    category: 'Interactive',
    popularity: 95,
  },
  {
    id: 'giveaway',
    title: 'Giveaway',
    description: 'Run engaging giveaways to boost viewer engagement and loyalty.',
    icon: Gift,
    category: 'Engagement',
    popularity: 88,
  },
];

export const MyShowTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mysteryBoxes, setMysteryBoxes] = useState<MysteryBox[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [livestreamProducts, setLivestreamProducts] = useState<unknown[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<unknown>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLivestreamProducts();
  }, [user]);

  const fetchLivestreamProducts = async () => {
    if (!user?.id) return;

    const result = await fetchProductsBySeller(user.id, {
      productType: 'livestream',
    });

    if (isFailure(result)) {
      console.error('Error fetching livestream products:', result.error);
      return;
    }

    setLivestreamProducts(result.data || []);
  };

  // Form states
  const [mysteryBoxForm, setMysteryBoxForm] = useState({
    name: '',
    boxCount: 3,
  });
  const [giveawayForm, setGiveawayForm] = useState({
    title: '',
    description: '',
    duration: 10,
  });

  const resetForms = () => {
    setMysteryBoxForm({ name: '', boxCount: 3 });
    setGiveawayForm({ title: '', description: '', duration: 10 });
  };

  const handleAddMysteryBox = () => {
    if (!mysteryBoxForm.name.trim()) {
      toast({ title: 'Error', description: 'Please enter a name for the mystery box' });
      return;
    }

    const newMysteryBox: MysteryBox = {
      id: Date.now().toString(),
      name: mysteryBoxForm.name,
      boxCount: mysteryBoxForm.boxCount,
      createdAt: new Date(),
    };

    if (isEditMode && editingItem) {
      setMysteryBoxes((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...newMysteryBox, id: editingItem.id } : item)),
      );
      toast({ title: 'Success', description: 'Mystery box updated successfully' });
    } else {
      setMysteryBoxes((prev) => [...prev, newMysteryBox]);
      toast({ title: 'Success', description: 'Mystery box added successfully' });
    }

    setIsAddDialogOpen(false);
    resetForms();
    setIsEditMode(false);
    setEditingItem(null);
  };

  const handleAddGiveaway = () => {
    if (!giveawayForm.title.trim()) {
      toast({ title: 'Error', description: 'Please enter a title for the giveaway' });
      return;
    }

    const newGiveaway: Giveaway = {
      id: Date.now().toString(),
      title: giveawayForm.title,
      description: giveawayForm.description,
      duration: giveawayForm.duration,
      createdAt: new Date(),
    };

    if (isEditMode && editingItem) {
      setGiveaways((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...newGiveaway, id: editingItem.id } : item)),
      );
      toast({ title: 'Success', description: 'Giveaway updated successfully' });
    } else {
      setGiveaways((prev) => [...prev, newGiveaway]);
      toast({ title: 'Success', description: 'Giveaway added successfully' });
    }

    setIsAddDialogOpen(false);
    resetForms();
    setIsEditMode(false);
    setEditingItem(null);
  };

  const handleEdit = (item: MysteryBox | Giveaway, type: string) => {
    setEditingItem(item);
    setIsEditMode(true);
    setSelectedTemplate(type);

    if (type === 'mystery-box') {
      const mysteryBox = item as MysteryBox;
      setMysteryBoxForm({
        name: mysteryBox.name,
        boxCount: mysteryBox.boxCount,
      });
    } else {
      const giveaway = item as Giveaway;
      setGiveawayForm({
        title: giveaway.title,
        description: giveaway.description,
        duration: giveaway.duration,
      });
    }

    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string, type: string) => {
    if (type === 'mystery-box') {
      setMysteryBoxes((prev) => prev.filter((item) => item.id !== id));
      toast({ title: 'Success', description: 'Mystery box deleted successfully' });
    } else {
      setGiveaways((prev) => prev.filter((item) => item.id !== id));
      toast({ title: 'Success', description: 'Giveaway deleted successfully' });
    }
  };

  const openAddDialog = (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsEditMode(false);
    setEditingItem(null);
    resetForms();
    setIsAddDialogOpen(true);
  };

  const AddShowFeatureDialog = () => (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Add'} Show Feature</DialogTitle>
          <DialogDescription>
            {!selectedTemplate
              ? 'Choose a template to get started'
              : selectedTemplate === 'mystery-box'
                ? 'Configure your mystery box'
                : 'Configure your giveaway'}
          </DialogDescription>
        </DialogHeader>

        {!selectedTemplate && (
          <div className="grid gap-4">
            {SHOW_TEMPLATES.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card
                  key={template.id}
                  className="cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-md"
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{template.title}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selectedTemplate === 'mystery-box' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mystery-name">Mystery Box Name</Label>
              <Input
                id="mystery-name"
                placeholder="Enter mystery box name..."
                value={mysteryBoxForm.name}
                onChange={(e) => setMysteryBoxForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="box-count">Number of Mystery Boxes: {mysteryBoxForm.boxCount}</Label>
              <Slider
                id="box-count"
                min={1}
                max={100}
                step={1}
                value={[mysteryBoxForm.boxCount]}
                onValueChange={(value) => setMysteryBoxForm((prev) => ({ ...prev, boxCount: value[0] }))}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">Choose any number of mystery boxes for your giveaway</p>
            </div>
          </div>
        )}

        {selectedTemplate === 'giveaway' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="giveaway-title">Giveaway Title</Label>
              <Input
                id="giveaway-title"
                placeholder="Enter giveaway title..."
                value={giveawayForm.title}
                onChange={(e) => setGiveawayForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="giveaway-description">Description</Label>
              <Textarea
                id="giveaway-description"
                placeholder="Describe your giveaway..."
                value={giveawayForm.description}
                onChange={(e) => setGiveawayForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes): {giveawayForm.duration}</Label>
              <Slider
                id="duration"
                min={1}
                max={60}
                step={1}
                value={[giveawayForm.duration]}
                onValueChange={(value) => setGiveawayForm((prev) => ({ ...prev, duration: value[0] }))}
                className="w-full"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsAddDialogOpen(false);
              setSelectedTemplate(null);
              resetForms();
              setIsEditMode(false);
              setEditingItem(null);
            }}
          >
            Cancel
          </Button>
          {selectedTemplate && (
            <Button onClick={selectedTemplate === 'mystery-box' ? handleAddMysteryBox : handleAddGiveaway}>
              {isEditMode ? 'Update' : 'Add'} {selectedTemplate === 'mystery-box' ? 'Mystery Box' : 'Giveaway'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Livestream Products Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5" />
            Livestream Products ({livestreamProducts.length})
          </h3>
          <Button onClick={() => navigate('/add-product?type=livestream')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Livestream Product
          </Button>
        </div>
        {livestreamProducts.length === 0 ? (
          <Card className="bg-muted/30 p-6 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">No livestream products yet</p>
            <Button onClick={() => navigate('/add-product?type=livestream')}>Add Your First Livestream Product</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {livestreamProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={product.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'}
                    alt={product.product_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h4 className="mb-2 line-clamp-1 font-medium">{product.product_name}</h4>
                  <p className="text-lg font-bold text-primary">£{Number(product.starting_price).toFixed(2)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddShowFeatureDialog />

      {/* Mystery Boxes List */}
      {mysteryBoxes.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Box className="h-5 w-5" />
              Mystery Boxes ({mysteryBoxes.length})
            </h3>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Show Feature
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
          <div className="space-y-4">
            {mysteryBoxes.map((mysteryBox) => (
              <Card key={mysteryBox.id} className="relative">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="mb-1 text-base font-medium">{mysteryBox.name}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{mysteryBox.boxCount} boxes</span>
                        <Badge variant="secondary" className="text-xs">
                          Interactive
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-4 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(mysteryBox, 'mystery-box')}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(mysteryBox.id, 'mystery-box')}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Giveaways List */}
      {giveaways.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Gift className="h-5 w-5" />
              Giveaways ({giveaways.length})
            </h3>
            {mysteryBoxes.length === 0 && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Show Feature
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </div>
          <div className="space-y-4">
            {giveaways.map((giveaway) => (
              <Card key={giveaway.id} className="relative">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="mb-1 text-base font-medium">{giveaway.title}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{giveaway.duration} min</span>
                        <Badge variant="secondary" className="text-xs">
                          Engagement
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-4 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(giveaway, 'giveaway')}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(giveaway.id, 'giveaway')}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {mysteryBoxes.length === 0 && giveaways.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-8 text-center">
            <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No Show Features Yet</h3>
            <p className="mb-4 text-muted-foreground">Get started by adding your first interactive show feature</p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Feature
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
