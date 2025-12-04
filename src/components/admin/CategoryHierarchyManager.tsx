import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Sparkles, X, Edit, ChevronDown, ChevronRight, Tag, Trash2 } from 'lucide-react';
import { filterBySubcategoryId, filterBySubSubcategoryId } from '@/lib/filterUtils';
import { toast } from 'sonner';
import { BlogImageUpload } from '@/components/blog/BlogImageUpload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  createSubcategory,
  createSubSubcategory,
  createSubSubSubcategory,
  deleteSubcategory,
  deleteSubSubcategory,
  deleteSubSubSubcategory,
  fetchSubSubcategoriesBySubcategoryIds,
  fetchSubSubSubcategoriesBySubSubcategoryIds,
  updateSubcategory,
  updateSubSubcategory,
  updateSubSubSubcategory,
  fetchSubcategories,
} from '@/services/categories';
import { invokeEdgeFunction } from '@/services/functions';
import { isFailure } from '@/types/api';

interface ProductCategoryRef {
  id: string;
  name: string;
}

interface ProductSubcategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  synonyms?: string[] | null;
  category_id: string;
  is_active?: boolean | null;
  image_url?: string | null;
}

interface ProductSubSubcategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  synonyms?: string[] | null;
  subcategory_id: string;
  is_active?: boolean | null;
  image_url?: string | null;
  show_in_category_grid?: boolean | null;
}

interface ProductSubSubSubcategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  synonyms?: string[] | null;
  sub_subcategory_id: string;
  is_active?: boolean | null;
}

interface SynonymEditorProps {
  id: string;
  name: string;
  synonyms: string[] | null;
  level: number;
  imageUrl?: string | null;
  showInCategoryGrid?: boolean | null;
  onClose: () => void;
  onSave: (name: string, synonyms: string[], imageUrl?: string, showInGrid?: boolean) => void;
}

function SynonymEditor({
  id,
  name,
  synonyms,
  level,
  imageUrl,
  showInCategoryGrid,
  onClose,
  onSave,
}: SynonymEditorProps) {
  const [editedName, setEditedName] = useState(name);
  const [editedSynonyms, setEditedSynonyms] = useState<string[]>(synonyms || []);
  const [newSynonym, setNewSynonym] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string>(imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [editedShowInGrid, setEditedShowInGrid] = useState<boolean>(showInCategoryGrid ?? true);

  const handleAddSynonym = () => {
    const value = newSynonym.trim().toLowerCase();
    if (value && !editedSynonyms.includes(value)) {
      setEditedSynonyms([...editedSynonyms, value]);
      setNewSynonym('');
    }
  };

  const handleRemoveSynonym = (index: number) => {
    const newSynonyms = [...editedSynonyms];
    newSynonyms.splice(index, 1);
    setEditedSynonyms(newSynonyms);
  };

  const handleGenerateSynonyms = async () => {
    setGenerating(true);
    try {
      const result = await invokeEdgeFunction<{ synonyms?: string[] }>({
        functionName: 'generate-category-synonyms',
        body: { categoryName: name, categoryLevel: level },
      });

      if (isFailure(result)) throw result.error;

      if (result.data?.synonyms) {
        setEditedSynonyms(result.data.synonyms);
        toast.success(`Generated ${result.data.synonyms.length} synonyms`);
      }
    } catch (error: unknown) {
      toast.error(`Failed to generate synonyms: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    onSave(editedName, editedSynonyms, editedImageUrl, level === 3 ? editedShowInGrid : undefined);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Category - {name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Category Name</Label>
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Enter category name"
              className="mb-4"
            />
          </div>

          <Separator />

          {(level === 2 || level === 3) && (
            <>
              <div>
                <BlogImageUpload
                  value={editedImageUrl}
                  onChange={setEditedImageUrl}
                  label="Category Image"
                  id={`category-image-${id}`}
                  onUploadStateChange={setIsUploading}
                />
              </div>
              <Separator />
            </>
          )}

          {level === 3 && (
            <>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-in-grid"
                  checked={editedShowInGrid}
                  onChange={(e) => setEditedShowInGrid(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="show-in-grid" className="text-sm font-medium">
                  Show in Category Grid
                </Label>
              </div>
              <Separator />
            </>
          )}

          <div>
            <Label>Search Synonyms</Label>
            <p className="mb-3 text-xs text-muted-foreground">Alternative terms users might search for</p>

            <div className="mb-3 flex gap-2">
              <Input
                placeholder="Add synonym..."
                value={newSynonym}
                onChange={(e) => setNewSynonym(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSynonym();
                  }
                }}
              />
              <Button onClick={handleAddSynonym} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSynonyms}
              disabled={generating}
              className="mb-3 w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>

            <ScrollArea className="h-64 rounded-md border p-3">
              <div className="flex flex-wrap gap-2">
                {editedSynonyms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No synonyms yet. Add some above or generate with AI.</p>
                ) : (
                  editedSynonyms.map((synonym, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      {synonym}
                      <button onClick={() => handleRemoveSynonym(idx)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function CategoryHierarchyManager({ category }: { category: ProductCategoryRef }) {
  const qc = useQueryClient();

  const [expandedL2, setExpandedL2] = useState<string[]>([]);
  const [expandedL3, setExpandedL3] = useState<string[]>([]);
  const [newL2Name, setNewL2Name] = useState('');
  const [newL3Names, setNewL3Names] = useState<Record<string, string>>({});
  const [newL4Names, setNewL4Names] = useState<Record<string, string>>({});

  const [editingSynonyms, setEditingSynonyms] = useState<{
    id: string;
    name: string;
    synonyms: string[] | null;
    level: number;
    imageUrl?: string | null;
    showInCategoryGrid?: boolean | null;
  } | null>(null);

  const [creating, setCreating] = useState<Record<string, boolean>>({});

  // Fetch all level 2 subcategories
  const { data: l2 = [], isLoading: loadingL2 } = useQuery({
    queryKey: ['product_subcategories', category.id],
    queryFn: async () => {
      const result = await fetchSubcategories(category.id);
      if (isFailure(result)) throw result.error;
      return result.data as ProductSubcategory[];
    },
  });

  // Fetch all level 3 subcategories for all level 2 items
  const { data: allL3 = [] } = useQuery({
    queryKey: ['all_product_sub_subcategories', category.id],
    queryFn: async () => {
      if (l2.length === 0) return [];
      const l2Ids = l2.map((item) => item.id);
      const result = await fetchSubSubcategoriesBySubcategoryIds(l2Ids);
      if (isFailure(result)) throw result.error;
      return result.data as ProductSubSubcategory[];
    },
    enabled: l2.length > 0,
  });

  // Fetch all level 4 subcategories
  const { data: allL4 = [] } = useQuery({
    queryKey: ['all_product_sub_sub_subcategories', category.id],
    queryFn: async () => {
      if (allL3.length === 0) return [];
      const l3Ids = allL3.map((item) => item.id);
      const result = await fetchSubSubSubcategoriesBySubSubcategoryIds(l3Ids);
      if (isFailure(result)) throw result.error;
      return result.data as ProductSubSubSubcategory[];
    },
    enabled: allL3.length > 0,
  });

  const toggleL2 = (id: string) => {
    setExpandedL2((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleL3 = (id: string) => {
    setExpandedL3((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addL2 = async () => {
    const name = newL2Name.trim();
    if (!name) return;
    try {
      setCreating((prev) => ({ ...prev, l2: true }));
      const result = await createSubcategory({
        name,
        slug: slugify(name),
        description: null,
        category_id: category.id,
        is_active: true,
      });
      if (isFailure(result)) throw result.error;
      toast.success('Subcategory created');
      setNewL2Name('');
      await qc.invalidateQueries({ queryKey: ['product_subcategories', category.id] });
    } catch (err: unknown) {
      toast.error(`Failed to create: ${err.message}`);
    } finally {
      setCreating((prev) => ({ ...prev, l2: false }));
    }
  };

  const addL3 = async (l2Id: string) => {
    const name = newL3Names[l2Id]?.trim();
    if (!name) return;
    try {
      setCreating((prev) => ({ ...prev, [`l3_${l2Id}`]: true }));
      const result = await createSubSubcategory({
        name,
        slug: slugify(name),
        description: null,
        subcategory_id: l2Id,
        is_active: true,
      });
      if (isFailure(result)) throw result.error;
      toast.success('Sub-subcategory created');
      setNewL3Names((prev) => ({ ...prev, [l2Id]: '' }));
      await qc.invalidateQueries({ queryKey: ['all_product_sub_subcategories', category.id] });
    } catch (err: unknown) {
      toast.error(`Failed to create: ${err.message}`);
    } finally {
      setCreating((prev) => ({ ...prev, [`l3_${l2Id}`]: false }));
    }
  };

  const addL4 = async (l3Id: string) => {
    const name = newL4Names[l3Id]?.trim();
    if (!name) return;
    try {
      setCreating((prev) => ({ ...prev, [`l4_${l3Id}`]: true }));
      // Generate unique slug for Level 4 to allow duplicates
      const uniqueSlug = `${slugify(name)}-${Date.now().toString(36)}`;
      const result = await createSubSubSubcategory({
        name,
        slug: uniqueSlug,
        description: null,
        sub_subcategory_id: l3Id,
        is_active: true,
      });
      if (isFailure(result)) throw result.error;
      toast.success('Level 4 subcategory created');
      setNewL4Names((prev) => ({ ...prev, [l3Id]: '' }));
      await qc.invalidateQueries({ queryKey: ['all_product_sub_sub_subcategories', category.id] });
    } catch (err: unknown) {
      toast.error(`Failed to create: ${err.message}`);
    } finally {
      setCreating((prev) => ({ ...prev, [`l4_${l3Id}`]: false }));
    }
  };

  const deleteL2 = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all subcategories under it.`))
      return;

    try {
      const result = await deleteSubcategory(id);
      if (isFailure(result)) throw result.error;
      toast.success('Subcategory deleted');
      await qc.invalidateQueries({ queryKey: ['product_subcategories', category.id] });
      await qc.invalidateQueries({ queryKey: ['all_product_sub_subcategories', category.id] });
      await qc.invalidateQueries({ queryKey: ['all_product_sub_sub_subcategories', category.id] });
    } catch (err: unknown) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  const deleteL3 = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all level 4 items under it.`))
      return;

    try {
      const result = await deleteSubSubcategory(id);
      if (isFailure(result)) throw result.error;
      toast.success('Sub-subcategory deleted');
      await qc.invalidateQueries({ queryKey: ['all_product_sub_subcategories', category.id] });
      await qc.invalidateQueries({ queryKey: ['all_product_sub_sub_subcategories', category.id] });
    } catch (err: unknown) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  const deleteL4 = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const result = await deleteSubSubSubcategory(id);
      if (isFailure(result)) throw result.error;
      toast.success('Level 4 subcategory deleted');
      await qc.invalidateQueries({ queryKey: ['all_product_sub_sub_subcategories', category.id] });
    } catch (err: unknown) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  const handleSaveSynonyms = async (name: string, synonyms: string[], imageUrl?: string, showInGrid?: boolean) => {
    if (!editingSynonyms) return;

    try {
      let updateError;
      const slug = slugify(name);

      if (editingSynonyms.level === 2) {
        const result = await updateSubcategory(editingSynonyms.id, {
          name,
          slug,
          synonyms,
          image_url: imageUrl || null,
        });
        if (isFailure(result)) throw result.error;
      } else if (editingSynonyms.level === 3) {
        const result = await updateSubSubcategory(editingSynonyms.id, {
          name,
          slug,
          synonyms,
          image_url: imageUrl || null,
          show_in_category_grid: showInGrid ?? true,
        });
        if (isFailure(result)) throw result.error;
      } else if (editingSynonyms.level === 4) {
        const result = await updateSubSubSubcategory(editingSynonyms.id, {
          name,
          slug,
          synonyms,
        });
        if (isFailure(result)) throw result.error;
      }

      toast.success('Category updated successfully');

      // Invalidate all relevant queries to refresh the UI
      qc.invalidateQueries({ queryKey: ['product_subcategories'] });
      qc.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      qc.invalidateQueries({ queryKey: ['mobile-mega-menu-categories'] });
      qc.invalidateQueries({ queryKey: ['mega-menu-custom-list-items'] });
      qc.invalidateQueries({ queryKey: ['mega-menu-custom-lists-for-layout'] });
      qc.invalidateQueries({ queryKey: ['all_product_sub_subcategories'] });
      qc.invalidateQueries({ queryKey: ['all_product_sub_sub_subcategories'] });
      qc.invalidateQueries({ queryKey: ['level3-categories-display'] });

      // Close the dialog and reset state
      setEditingSynonyms(null);
    } catch (error: unknown) {
      toast.error(`Failed to update: ${error.message}`);
    }
  };

  const getL3ForL2 = (l2Id: string) => filterBySubcategoryId(allL3, l2Id);
  const getL4ForL3 = (l3Id: string) => filterBySubSubcategoryId(allL4, l3Id);

  return (
    <>
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Manage subcategories for <strong>{category.name}</strong>
            </p>
            <Badge variant="outline">{l2.length} Level 2 items</Badge>
          </div>

          {/* Add Level 2 */}
          <Card className="bg-muted/30 p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add new Level 2 subcategory..."
                value={newL2Name}
                onChange={(e) => setNewL2Name(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addL2()}
              />
              <Button onClick={addL2} disabled={creating.l2}>
                {creating.l2 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </Card>

          {loadingL2 ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : l2.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No subcategories yet</div>
          ) : (
            <div className="space-y-3">
              {l2.map((l2Item) => {
                const l3Items = getL3ForL2(l2Item.id);
                const isExpanded = expandedL2.includes(l2Item.id);

                return (
                  <Card key={l2Item.id} className="overflow-hidden">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleL2(l2Item.id)}>
                      <div className="bg-primary/5 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CollapsibleTrigger className="flex items-center gap-2 hover:underline">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="font-semibold">Level 2: {l2Item.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {l3Items.length} subcategories
                              </Badge>
                            </CollapsibleTrigger>

                            {/* Level 2 Synonyms */}
                            {l2Item.synonyms && l2Item.synonyms.length > 0 && (
                              <div className="mt-2 pl-6">
                                <div className="mb-1 flex items-center gap-2">
                                  <Tag className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs font-medium text-muted-foreground">Synonyms:</span>
                                </div>
                                <div className="flex flex-wrap gap-1 pl-5">
                                  {l2Item.synonyms.map((syn, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {syn}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingSynonyms({
                                  id: l2Item.id,
                                  name: l2Item.name,
                                  synonyms: l2Item.synonyms,
                                  level: 2,
                                  imageUrl: l2Item.image_url,
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteL2(l2Item.id, l2Item.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <CollapsibleContent>
                        <div className="space-y-3 border-t p-4">
                          {/* Add Level 3 */}
                          <div className="flex gap-2 pl-6">
                            <Input
                              placeholder="Add Level 3..."
                              value={newL3Names[l2Item.id] || ''}
                              onChange={(e) => setNewL3Names((prev) => ({ ...prev, [l2Item.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && addL3(l2Item.id)}
                            />
                            <Button onClick={() => addL3(l2Item.id)} disabled={creating[`l3_${l2Item.id}`]} size="sm">
                              {creating[`l3_${l2Item.id}`] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          {/* Level 3 Items */}
                          {l3Items.length === 0 ? (
                            <div className="pl-6 text-xs text-muted-foreground">No Level 3 subcategories</div>
                          ) : (
                            <div className="space-y-2 pl-6">
                              {l3Items.map((l3Item) => {
                                const l4Items = getL4ForL3(l3Item.id);
                                const isL3Expanded = expandedL3.includes(l3Item.id);

                                return (
                                  <Card key={l3Item.id} className="bg-background">
                                    <Collapsible open={isL3Expanded} onOpenChange={() => toggleL3(l3Item.id)}>
                                      <div className="p-3">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <CollapsibleTrigger className="flex items-center gap-2 hover:underline">
                                              {isL3Expanded ? (
                                                <ChevronDown className="h-3 w-3" />
                                              ) : (
                                                <ChevronRight className="h-3 w-3" />
                                              )}
                                              <span className="text-sm font-medium">Level 3: {l3Item.name}</span>
                                              <Badge variant="secondary" className="text-xs">
                                                {l4Items.length} items
                                              </Badge>
                                            </CollapsibleTrigger>

                                            {/* Level 3 Synonyms */}
                                            {l3Item.synonyms && l3Item.synonyms.length > 0 && (
                                              <div className="mt-2 pl-5">
                                                <div className="mb-1 flex items-center gap-2">
                                                  <Tag className="h-3 w-3 text-muted-foreground" />
                                                  <span className="text-xs font-medium text-muted-foreground">
                                                    Synonyms:
                                                  </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 pl-5">
                                                  {l3Item.synonyms.map((syn, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                      {syn}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setEditingSynonyms({
                                                  id: l3Item.id,
                                                  name: l3Item.name,
                                                  synonyms: l3Item.synonyms,
                                                  level: 3,
                                                  imageUrl: l3Item.image_url,
                                                  showInCategoryGrid: l3Item.show_in_category_grid,
                                                });
                                              }}
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => deleteL3(l3Item.id, l3Item.name)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>

                                      <CollapsibleContent>
                                        <div className="space-y-2 border-t px-3 pb-3 pt-2">
                                          {/* Add Level 4 */}
                                          <div className="flex gap-2 pl-5">
                                            <Input
                                              placeholder="Add Level 4..."
                                              value={newL4Names[l3Item.id] || ''}
                                              onChange={(e) =>
                                                setNewL4Names((prev) => ({ ...prev, [l3Item.id]: e.target.value }))
                                              }
                                              onKeyDown={(e) => e.key === 'Enter' && addL4(l3Item.id)}
                                              className="h-8 text-sm"
                                            />
                                            <Button
                                              onClick={() => addL4(l3Item.id)}
                                              disabled={creating[`l4_${l3Item.id}`]}
                                              size="sm"
                                            >
                                              {creating[`l4_${l3Item.id}`] ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                              ) : (
                                                <Plus className="h-3 w-3" />
                                              )}
                                            </Button>
                                          </div>

                                          {/* Level 4 Items */}
                                          {l4Items.length === 0 ? (
                                            <div className="pl-5 text-xs text-muted-foreground">
                                              No Level 4 subcategories
                                            </div>
                                          ) : (
                                            <div className="space-y-1 pl-5">
                                              {l4Items.map((l4Item) => (
                                                <div key={l4Item.id} className="rounded border bg-muted/30 p-2">
                                                  <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                      <span className="text-sm font-medium">
                                                        Level 4: {l4Item.name}
                                                      </span>

                                                      {/* Level 4 Synonyms */}
                                                      {l4Item.synonyms && l4Item.synonyms.length > 0 && (
                                                        <div className="mt-1 pl-4">
                                                          <div className="mb-1 flex items-center gap-2">
                                                            <Tag className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                              Synonyms:
                                                            </span>
                                                          </div>
                                                          <div className="flex flex-wrap gap-1 pl-5">
                                                            {l4Item.synonyms.map((syn, idx) => (
                                                              <Badge key={idx} variant="outline" className="text-xs">
                                                                {syn}
                                                              </Badge>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                          setEditingSynonyms({
                                                            id: l4Item.id,
                                                            name: l4Item.name,
                                                            synonyms: l4Item.synonyms,
                                                            level: 4,
                                                          });
                                                        }}
                                                      >
                                                        <Edit className="h-3 w-3" />
                                                      </Button>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteL4(l4Item.id, l4Item.name)}
                                                      >
                                                        <Trash2 className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {editingSynonyms && (
        <SynonymEditor
          id={editingSynonyms.id}
          name={editingSynonyms.name}
          synonyms={editingSynonyms.synonyms}
          level={editingSynonyms.level}
          imageUrl={'imageUrl' in editingSynonyms ? editingSynonyms.imageUrl : undefined}
          showInCategoryGrid={'showInCategoryGrid' in editingSynonyms ? editingSynonyms.showInCategoryGrid : undefined}
          onClose={() => setEditingSynonyms(null)}
          onSave={handleSaveSynonyms}
        />
      )}
    </>
  );
}
