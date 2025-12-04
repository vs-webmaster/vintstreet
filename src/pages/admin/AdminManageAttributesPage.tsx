import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchAttributeGroups,
  fetchAllAttributes,
  fetchAttributeCategoryLinks,
  fetchAttributeSubcategoryLinks,
  fetchAttributeSubSubcategoryLinks,
  linkAttributeToCategory,
  unlinkAttributeFromCategory,
  linkAttributeToSubcategory,
  unlinkAttributeFromSubcategory,
  linkAttributeToSubSubcategory,
  unlinkAttributeFromSubSubcategory,
} from '@/services/attributes';
import { fetchCategoryList, fetchSubcategories, fetchSubSubcategoriesBySubcategoryIds } from '@/services/categories';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

interface Attribute {
  id: string;
  category_id?: string;
  name?: string;
  data_type?: string;
  is_required?: boolean;
  group_id?: string;
  display_order?: number | null;
}

interface AttributeGroup {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

interface ProductCategory {
  id: string;
  name: string;
}

interface ProductSubcategory {
  id: string;
  name: string;
  category_id: string;
}

interface ProductSubSubcategory {
  id: string;
  name: string;
  subcategory_id: string;
}

const AdminManageAttributesPage = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<ProductSubcategory | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<'l1' | 'l2' | 'l3' | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [attributeGroupFilter, setAttributeGroupFilter] = useState<string>('');

  const { data: groups = [] } = useQuery({
    queryKey: ['attribute-groups-manage'],
    queryFn: async () => {
      const result = await fetchAttributeGroups();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!user?.id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-manage-attrs'],
    queryFn: async () => {
      const result = await fetchCategoryList();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!user?.id,
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories-manage-attrs', selectedCategory?.id],
    queryFn: async () => {
      if (!selectedCategory?.id) return [];
      const result = await fetchSubcategories(selectedCategory.id);
      if (isFailure(result)) throw result.error;
      return result.data.map((s) => ({ id: s.id, name: s.name, category_id: s.category_id }));
    },
    enabled: !!selectedCategory?.id,
  });

  const { data: subSubcategories = [] } = useQuery({
    queryKey: ['sub-subcategories-manage-attrs', selectedCategory?.id],
    queryFn: async () => {
      if (!selectedCategory?.id) return [];
      // Get all sub-subcategories for subcategories under this category
      const subcategoryIds = subcategories.map((s) => s.id);
      if (subcategoryIds.length === 0) return [];

      const result = await fetchSubSubcategoriesBySubcategoryIds(subcategoryIds);
      if (isFailure(result)) throw result.error;
      return result.data
        .filter((s) => s.is_active)
        .map((s) => ({ id: s.id, name: s.name, subcategory_id: s.subcategory_id }));
    },
    enabled: !!selectedCategory?.id && subcategories.length > 0,
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes-manage'],
    queryFn: async () => {
      const result = await fetchAllAttributes();
      if (isFailure(result)) throw result.error;
      // The service returns attributes with category_id, is_required, group_id from the database
      return result.data as Attribute[];
    },
    enabled: !!user?.id,
  });

  const { data: categoryLinks = [], refetch: refetchCategoryLinks } = useQuery({
    queryKey: ['attribute-category-links'],
    queryFn: async () => {
      const result = await fetchAttributeCategoryLinks();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!user?.id,
  });

  const { data: subcategoryLinks = [], refetch: refetchSubcategoryLinks } = useQuery({
    queryKey: ['attribute-subcategory-links'],
    queryFn: async () => {
      const result = await fetchAttributeSubcategoryLinks();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!user?.id,
  });

  const { data: subSubcategoryLinks = [], refetch: refetchSubSubcategoryLinks } = useQuery({
    queryKey: ['attribute-sub-subcategory-links'],
    queryFn: async () => {
      const result = await fetchAttributeSubSubcategoryLinks();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!user?.id,
  });

  const getLinkedAttributes = (categoryId: string, level: 'l1' | 'l2' | 'l3') => {
    if (level === 'l1') {
      return attributes.filter((attr) =>
        categoryLinks.some((link) => link.attribute_id === attr.id && link.category_id === categoryId),
      );
    } else if (level === 'l2') {
      return attributes.filter((attr) =>
        subcategoryLinks.some((link) => link.attribute_id === attr.id && link.subcategory_id === categoryId),
      );
    } else {
      return attributes.filter((attr) =>
        subSubcategoryLinks.some((link) => link.attribute_id === attr.id && link.sub_subcategory_id === categoryId),
      );
    }
  };

  const handleToggleLink = async (attrId: string, categoryId: string, level: 'l1' | 'l2' | 'l3') => {
    try {
      if (level === 'l1') {
        const isLinked = categoryLinks.some((link) => link.attribute_id === attrId && link.category_id === categoryId);
        if (isLinked) {
          const result = await unlinkAttributeFromCategory(attrId, categoryId);
          if (isFailure(result)) throw result.error;
          toast.success('Attribute unlinked');
        } else {
          const result = await linkAttributeToCategory(attrId, categoryId);
          if (isFailure(result)) throw result.error;
          toast.success('Attribute linked');
        }
        refetchCategoryLinks();
      } else if (level === 'l2') {
        const isLinked = subcategoryLinks.some(
          (link) => link.attribute_id === attrId && link.subcategory_id === categoryId,
        );
        if (isLinked) {
          const result = await unlinkAttributeFromSubcategory(attrId, categoryId);
          if (isFailure(result)) throw result.error;
          toast.success('Attribute unlinked');
        } else {
          const result = await linkAttributeToSubcategory(attrId, categoryId);
          if (isFailure(result)) throw result.error;
          toast.success('Attribute linked');
        }
        refetchSubcategoryLinks();
      } else {
        const isLinked = subSubcategoryLinks.some(
          (link) => link.attribute_id === attrId && link.sub_subcategory_id === categoryId,
        );
        if (isLinked) {
          const result = await unlinkAttributeFromSubSubcategory(attrId, categoryId);
          if (isFailure(result)) throw result.error;
          toast.success('Attribute unlinked');
        } else {
          const result = await linkAttributeToSubSubcategory(attrId, categoryId);
          if (isFailure(result)) throw result.error;
          toast.success('Attribute linked');
        }
        refetchSubSubcategoryLinks();
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const renderAttributeEditor = (categoryId: string, level: 'l1' | 'l2' | 'l3', linkedAttrs: Attribute[]) => {
    const filteredAttributes = attributeGroupFilter
      ? attributeGroupFilter === 'ungrouped'
        ? attributes.filter((attr) => !attr.group_id)
        : attributes.filter((attr) => attr.group_id === attributeGroupFilter)
      : attributes;

    const idKey = level === 'l1' ? 'category_id' : level === 'l2' ? 'subcategory_id' : 'sub_subcategory_id';
    const allLinks = level === 'l1' ? categoryLinks : level === 'l2' ? subcategoryLinks : subSubcategoryLinks;

    return (
      <div className="mt-3 space-y-2 border-t pt-3">
        <div className="mb-2 flex items-center gap-2">
          <Label className="min-w-fit text-xs font-medium">Filter:</Label>
          <Select
            value={attributeGroupFilter || 'all'}
            onValueChange={(value) => setAttributeGroupFilter(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All attributes</SelectItem>
              <SelectItem value="ungrouped">Ungrouped</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredAttributes.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            {attributeGroupFilter ? 'No attributes in this group' : 'No attributes available'}
          </p>
        ) : (
          <div className="max-h-[400px] space-y-1.5 overflow-y-auto">
            {filteredAttributes.map((attr) => {
              const isLinked = allLinks.some(
                (link: any) => link.attribute_id === attr.id && link[idKey] === categoryId,
              );

              return (
                <div
                  key={attr.id}
                  className="flex items-center justify-between rounded border bg-background p-2 text-xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate font-medium">{attr.name}</span>
                    <Badge variant="outline" className="px-1 py-0 text-[10px]">
                      {attr.data_type}
                    </Badge>
                    {attr.is_required && (
                      <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                        Req
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant={isLinked ? 'default' : 'outline'}
                    size="sm"
                    className="ml-2 h-7 shrink-0 text-xs"
                    onClick={() => handleToggleLink(attr.id, categoryId, level)}
                  >
                    {isLinked ? '✓' : 'Link'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const openEditDialog = (id: string, level: 'l1' | 'l2' | 'l3', name: string) => {
    setEditingId(id);
    setEditingLevel(level);
    setEditingName(name);
  };

  const closeEditDialog = () => {
    setEditingId(null);
    setEditingLevel(null);
    setEditingName('');
    setAttributeGroupFilter('');
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Attributes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a Level 1 category to view all its subcategories and linked attributes
          </p>
        </div>

        <div className="grid h-[calc(100vh-180px)] grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Level 1 Category Selector */}
          <Card className="flex flex-col p-4 lg:col-span-1">
            <h3 className="mb-3 text-sm font-semibold">Level 1 Categories</h3>
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedSubcategory(null);
                      setEditingId(null);
                    }}
                    className={`w-full rounded-md p-3 text-left text-sm transition ${
                      selectedCategory?.id === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Horizontal Diagram View */}
          <Card className="flex flex-col overflow-hidden p-0 lg:col-span-4">
            {!selectedCategory ? (
              <div className="p-6 py-12 text-center text-muted-foreground">
                <p>Select a Level 1 category to view its subcategories and attributes</p>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                {/* L1 Header */}
                <div className="shrink-0 border-b bg-primary/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        L1
                      </Badge>
                      <h3 className="font-semibold">{selectedCategory.name}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(selectedCategory.id, 'l1', selectedCategory.name)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  {(() => {
                    const linkedL1Attrs = getLinkedAttributes(selectedCategory.id, 'l1');
                    return (
                      <div className="flex flex-wrap gap-1">
                        {linkedL1Attrs.length === 0 ? (
                          <span className="text-xs italic text-muted-foreground">No attributes</span>
                        ) : (
                          linkedL1Attrs.map((attr) => (
                            <Badge key={attr.id} variant="secondary" className="text-xs">
                              {attr.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Horizontal Scrolling L2 */}
                {!selectedSubcategory && (
                  <div className="flex-1 overflow-x-auto">
                    <div className="flex h-full gap-6 p-6 pb-4" style={{ minWidth: 'max-content' }}>
                      {subcategories.map((subcategory) => {
                        const subcategorySubSubcategories = subSubcategories.filter(
                          (subsub) => subsub.subcategory_id === subcategory.id,
                        );
                        const linkedL2Attrs = getLinkedAttributes(subcategory.id, 'l2');

                        return (
                          <Card
                            key={subcategory.id}
                            className={`flex h-full w-[320px] shrink-0 cursor-pointer flex-col transition ${
                              selectedSubcategory?.id === subcategory.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedSubcategory(subcategory)}
                          >
                            <div className="shrink-0 border-b bg-muted/30 p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    L2
                                  </Badge>
                                  <h4 className="text-sm font-semibold">{subcategory.name}</h4>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(subcategory.id, 'l2', subcategory.name);
                                  }}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {linkedL2Attrs.length === 0 ? (
                                  <span className="text-xs italic text-muted-foreground">No attributes</span>
                                ) : (
                                  linkedL2Attrs.map((attr) => (
                                    <Badge key={attr.id} variant="secondary" className="px-1.5 py-0 text-[10px]">
                                      {attr.name}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </div>

                            <div className="p-3 text-center text-xs text-muted-foreground">
                              {subcategorySubSubcategories.length} Level 3{' '}
                              {subcategorySubSubcategories.length === 1 ? 'category' : 'categories'}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Horizontal Scrolling L3 when L2 is selected */}
                {selectedSubcategory && (
                  <div className="flex flex-1 flex-col">
                    <div className="shrink-0 border-b bg-secondary/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            L2
                          </Badge>
                          <h3 className="font-semibold">{selectedSubcategory.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(selectedSubcategory.id, 'l2', selectedSubcategory.name)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedSubcategory(null)}>
                            Back to L2s
                          </Button>
                        </div>
                      </div>

                      {(() => {
                        const linkedL2Attrs = getLinkedAttributes(selectedSubcategory.id, 'l2');
                        return (
                          <div className="flex flex-wrap gap-1">
                            {linkedL2Attrs.length === 0 ? (
                              <span className="text-xs italic text-muted-foreground">No attributes</span>
                            ) : (
                              linkedL2Attrs.map((attr) => (
                                <Badge key={attr.id} variant="secondary" className="text-xs">
                                  {attr.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex-1 overflow-x-auto">
                      <div className="flex h-full gap-6 p-6 pb-4" style={{ minWidth: 'max-content' }}>
                        {subSubcategories
                          .filter((subsub) => subsub.subcategory_id === selectedSubcategory.id)
                          .map((subsubcategory) => {
                            const linkedL3Attrs = getLinkedAttributes(subsubcategory.id, 'l3');

                            return (
                              <Card key={subsubcategory.id} className="flex h-full w-[320px] shrink-0 flex-col">
                                <div className="shrink-0 border-b bg-muted/30 p-3">
                                  <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        L3
                                      </Badge>
                                      <h4 className="text-sm font-semibold">{subsubcategory.name}</h4>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7"
                                      onClick={() => openEditDialog(subsubcategory.id, 'l3', subsubcategory.name)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>

                                  <div className="flex flex-wrap gap-1">
                                    {linkedL3Attrs.length === 0 ? (
                                      <span className="text-xs italic text-muted-foreground">No attributes</span>
                                    ) : (
                                      linkedL3Attrs.map((attr) => (
                                        <Badge key={attr.id} variant="secondary" className="px-1.5 py-0 text-[10px]">
                                          {attr.name}
                                        </Badge>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Attribute Editor Dialog */}
        <Dialog open={!!editingId} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  {editingLevel === 'l1' ? 'L1' : editingLevel === 'l2' ? 'L2' : 'L3'}
                </Badge>
                {editingName}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              {editingId &&
                editingLevel &&
                renderAttributeEditor(editingId, editingLevel, getLinkedAttributes(editingId, editingLevel))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminManageAttributesPage;
