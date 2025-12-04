import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Settings as SettingsIcon, List, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchAllAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  fetchAttributeGroups,
  createAttributeGroup,
  updateAttributeGroup,
  deleteAttributeGroup,
  fetchAttributeOptionsFull,
  createAttributeOption,
  bulkCreateAttributeOptions,
  updateAttributeOption,
  deleteAttributeOption,
  fetchAttributeOptionCounts,
  type AttributeGroup,
  type AttributeOption,
} from '@/services/attributes';
import { fetchCategories } from '@/services/categories';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

// Define local Attribute interface for admin page (more specific than service type)
interface AdminAttribute {
  id: string;
  category_id: string;
  name: string;
  display_label?: string | null;
  data_type: string;
  is_required: boolean;
  display_order: number;
  group_id?: string | null;
}

type SortField = 'name' | 'options_count' | 'display_order';
type SortDirection = 'asc' | 'desc';

const AdminAttributesPage = () => {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AdminAttribute | null>(null);
  const [managingOptionsAttribute, setManagingOptionsAttribute] = useState<AdminAttribute | null>(null);
  const [editingGroup, setEditingGroup] = useState<AttributeGroup | null>(null);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [bulkOptions, setBulkOptions] = useState('');
  const [sortField, setSortField] = useState<SortField>('display_order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('');
  const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false);
  const [newAttribute, setNewAttribute] = useState({
    name: '',
    display_label: '',
    data_type: 'string',
    is_required: false,
    group_id: '',
  });
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const { data: groups = [], refetch: refetchGroups } = useQuery({
    queryKey: ['attribute-groups'],
    queryFn: async () => {
      const result = await fetchAttributeGroups();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!user?.id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-for-attributes'],
    queryFn: async () => {
      const result = await fetchCategories();
      if (isFailure(result)) throw result.error;
      return result.data.filter((cat) => cat.is_active).map((cat) => ({ id: cat.id, name: cat.name }));
    },
    enabled: !!user?.id,
  });

  const {
    data: attributes = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['global-attributes'],
    queryFn: async () => {
      const result = await fetchAllAttributes();
      if (isFailure(result)) throw result.error;
      return result.data
        .map((attr) => ({
          id: attr.id || '',
          category_id: (attr.category_id as string) || '',
          name: (attr.name as string) || '',
          display_label: (attr.display_label as string | null | undefined) || null,
          data_type: (attr.data_type as string) || 'string',
          is_required: (attr.is_required as boolean | null) ?? false,
          display_order: (attr.display_order as number | null) ?? 0,
          group_id: (attr.group_id as string | null | undefined) || null,
        }))
        .sort((a, b) => a.display_order - b.display_order);
    },
    enabled: !!user?.id,
  });

  // Fetch option counts for all attributes
  const { data: optionCounts = {}, refetch: refetchCounts } = useQuery({
    queryKey: ['attribute-option-counts'],
    queryFn: async () => {
      const result = await fetchAttributeOptionCounts();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!user?.id,
  });

  const { data: attributeOptions = [], refetch: refetchOptions } = useQuery({
    queryKey: ['attribute-options', managingOptionsAttribute?.id],
    queryFn: async () => {
      if (!managingOptionsAttribute?.id) return [];
      const result = await fetchAttributeOptionsFull(managingOptionsAttribute.id);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!managingOptionsAttribute?.id,
  });

  const handleCreateAttribute = async () => {
    if (!newAttribute.name.trim()) {
      toast.error('Attribute name is required');
      return;
    }

    const categoryIdToUse = selectedCategoryId || categories[0]?.id;
    if (!categoryIdToUse) {
      toast.error('Please create a category first');
      return;
    }

    try {
      // Get max display order
      const maxOrder = attributes.length > 0 ? Math.max(...attributes.map((a) => a.display_order)) : 0;
      const nextOrder = maxOrder + 1;

      const result = await createAttribute({
        name: newAttribute.name,
        display_label: newAttribute.display_label || newAttribute.name,
        data_type: newAttribute.data_type,
        is_required: newAttribute.is_required,
        display_order: nextOrder,
        category_id: categoryIdToUse,
        group_id: newAttribute.group_id || null,
      });

      if (isFailure(result)) throw result.error;

      toast.success('Attribute created successfully');
      setNewAttribute({ name: '', display_label: '', data_type: 'string', is_required: false, group_id: '' });
      setSelectedCategoryId('');
      setIsCreateOpen(false);
      refetch();
    } catch (error: unknown) {
      toast.error(`Failed to create attribute: ${error.message}`);
    }
  };

  const handleUpdateAttribute = async () => {
    if (!editingAttribute || !editingAttribute.name.trim()) {
      toast.error('Attribute name is required');
      return;
    }

    try {
      const result = await updateAttribute(editingAttribute.id, {
        name: editingAttribute.name,
        display_label: editingAttribute.display_label || editingAttribute.name,
        data_type: editingAttribute.data_type,
        is_required: editingAttribute.is_required,
        group_id: editingAttribute.group_id || null,
      });

      if (isFailure(result)) throw result.error;

      toast.success('Attribute updated successfully');
      setEditingAttribute(null);
      setIsEditOpen(false);
      refetch();
    } catch (error: unknown) {
      toast.error(`Failed to update attribute: ${error.message}`);
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm('Delete this attribute? This will also delete all its options and category links.')) return;

    try {
      const result = await deleteAttribute(id);
      if (isFailure(result)) throw result.error;
      toast.success('Attribute deleted successfully');
      refetch();
    } catch (error: unknown) {
      toast.error(`Failed to delete attribute: ${error.message}`);
    }
  };

  const handleAddOption = async () => {
    if (!newOptionValue.trim() || !managingOptionsAttribute) {
      toast.error('Option value is required');
      return;
    }

    try {
      const maxOrder = attributeOptions.length > 0 ? Math.max(...attributeOptions.map((o) => o.display_order)) : 0;
      const nextOrder = maxOrder + 1;

      const result = await createAttributeOption(managingOptionsAttribute.id, newOptionValue, nextOrder);
      if (isFailure(result)) throw result.error;

      toast.success('Option added successfully');
      setNewOptionValue('');
      refetchOptions();
      refetchCounts();
    } catch (error: unknown) {
      toast.error(`Failed to add option: ${error.message}`);
    }
  };

  const handleBulkAddOptions = async () => {
    if (!bulkOptions.trim() || !managingOptionsAttribute) {
      toast.error('Please enter options to add');
      return;
    }

    try {
      // Split by newlines and filter out empty lines
      const options = bulkOptions
        .split('\n')
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);

      if (options.length === 0) {
        toast.error('No valid options found');
        return;
      }

      const result = await bulkCreateAttributeOptions(managingOptionsAttribute.id, options);
      if (isFailure(result)) throw result.error;

      toast.success(`Successfully added ${options.length} option(s)`);
      setBulkOptions('');
      setIsBulkAddOpen(false);
      refetchOptions();
      refetchCounts();
    } catch (error: unknown) {
      toast.error(`Failed to add options: ${error.message}`);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Delete this option?')) return;

    try {
      const result = await deleteAttributeOption(optionId);
      if (isFailure(result)) throw result.error;
      toast.success('Option deleted successfully');
      refetchOptions();
      refetchCounts();
    } catch (error: unknown) {
      toast.error(`Failed to delete option: ${error.message}`);
    }
  };

  const handleToggleOptionActive = async (optionId: string, currentActive: boolean) => {
    try {
      const result = await updateAttributeOption(optionId, { is_active: !currentActive });
      if (isFailure(result)) throw result.error;
      toast.success(`Option ${!currentActive ? 'activated' : 'deactivated'} successfully`);
      refetchOptions();
    } catch (error: unknown) {
      toast.error(`Failed to update option: ${error.message}`);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const result = await createAttributeGroup({
        name: newGroup.name,
        description: newGroup.description || null,
      });
      if (isFailure(result)) throw result.error;

      toast.success('Group created successfully');
      setNewGroup({ name: '', description: '' });
      setIsGroupDialogOpen(false);
      setEditingGroup(null);
      refetchGroups();
    } catch (error: unknown) {
      toast.error(`Failed to create group: ${error.message}`);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !editingGroup.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const result = await updateAttributeGroup(editingGroup.id, {
        name: editingGroup.name,
        description: editingGroup.description || null,
      });
      if (isFailure(result)) throw result.error;

      toast.success('Group updated successfully');
      setEditingGroup(null);
      setIsGroupDialogOpen(false);
      refetchGroups();
    } catch (error: unknown) {
      toast.error(`Failed to update group: ${error.message}`);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Delete this group? Attributes in this group will be unassigned.')) return;

    try {
      const result = await deleteAttributeGroup(id);
      if (isFailure(result)) throw result.error;
      toast.success('Group deleted successfully');
      refetchGroups();
    } catch (error: unknown) {
      toast.error(`Failed to delete group: ${error.message}`);
    }
  };

  // Sort and filter attributes
  const sortedAttributes = useMemo(() => {
    let filtered = [...attributes];

    // Filter by group
    if (selectedGroupFilter) {
      if (selectedGroupFilter === 'ungrouped') {
        filtered = filtered.filter((attr) => !attr.group_id);
      } else {
        filtered = filtered.filter((attr) => attr.group_id === selectedGroupFilter);
      }
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'options_count') {
        const countA = optionCounts[a.id] || 0;
        const countB = optionCounts[b.id] || 0;
        comparison = countA - countB;
      } else if (sortField === 'display_order') {
        comparison = a.display_order - b.display_order;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [attributes, sortField, sortDirection, optionCounts, selectedGroupFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Product Attributes</h1>
          <Button onClick={() => setIsManageGroupsOpen(true)}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            Manage Groups
          </Button>
        </div>

        {/* Manage Groups Dialog */}
        <Dialog open={isManageGroupsOpen} onOpenChange={setIsManageGroupsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Attribute Groups</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Dialog
                open={isGroupDialogOpen}
                onOpenChange={(open) => {
                  setIsGroupDialogOpen(open);
                  if (!open) {
                    setEditingGroup(null);
                    setNewGroup({ name: '', description: '' });
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={editingGroup ? editingGroup.name : newGroup.name}
                        onChange={(e) =>
                          editingGroup
                            ? setEditingGroup({ ...editingGroup, name: e.target.value })
                            : setNewGroup({ ...newGroup, name: e.target.value })
                        }
                        placeholder="e.g., Mens Attributes"
                      />
                    </div>
                    <div>
                      <Label>Description (optional)</Label>
                      <Textarea
                        value={editingGroup ? editingGroup.description || '' : newGroup.description}
                        onChange={(e) =>
                          editingGroup
                            ? setEditingGroup({ ...editingGroup, description: e.target.value })
                            : setNewGroup({ ...newGroup, description: e.target.value })
                        }
                        placeholder="Description of this group"
                      />
                    </div>
                    <Button onClick={editingGroup ? handleUpdateGroup : handleCreateGroup} className="w-full">
                      {editingGroup ? 'Update Group' : 'Create Group'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {groups.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No groups created yet</p>
                  ) : (
                    <div className="grid gap-2">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
                          <div className="flex-1">
                            <div className="font-medium">{group.name}</div>
                            {group.description && (
                              <div className="mt-1 text-sm text-muted-foreground">{group.description}</div>
                            )}
                            <div className="mt-2 text-xs text-muted-foreground">
                              {attributes.filter((attr) => attr.group_id === group.id).length} attributes
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingGroup(group);
                                setIsGroupDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        {/* Attributes Section */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Attributes</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Attribute
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Attribute</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newAttribute.name}
                    onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                    placeholder="e.g., Size"
                  />
                </div>
                <div>
                  <Label>Display Label (optional)</Label>
                  <Input
                    value={newAttribute.display_label}
                    onChange={(e) => setNewAttribute({ ...newAttribute, display_label: e.target.value })}
                    placeholder="e.g., Product Size"
                  />
                </div>
                <div>
                  <Label>Data Type</Label>
                  <Select
                    value={newAttribute.data_type}
                    onValueChange={(value) => setNewAttribute({ ...newAttribute, data_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100] border border-border bg-popover shadow-lg">
                      <SelectItem value="string">Text (Dropdown)</SelectItem>
                      <SelectItem value="multi-select">Multi-Select</SelectItem>
                      <SelectItem value="textarea">Text Area</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={newAttribute.is_required}
                    onCheckedChange={(checked) => setNewAttribute({ ...newAttribute, is_required: checked as boolean })}
                  />
                  <Label htmlFor="required">Required field</Label>
                </div>
                <div>
                  <Label>Group (optional)</Label>
                  <Select
                    value={newAttribute.group_id || 'none'}
                    onValueChange={(value) =>
                      setNewAttribute({ ...newAttribute, group_id: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No group" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] border border-border bg-popover shadow-lg">
                      <SelectItem value="none">No group</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateAttribute} className="w-full">
                  Create Attribute
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <Label className="mb-3 block">Filter by Group</Label>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <Button
                  variant={selectedGroupFilter === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGroupFilter('')}
                >
                  All attributes
                </Button>
                <Button
                  variant={selectedGroupFilter === 'ungrouped' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGroupFilter('ungrouped')}
                >
                  Ungrouped
                </Button>
                {groups.map((group) => (
                  <Button
                    key={group.id}
                    variant={selectedGroupFilter === group.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedGroupFilter(group.id)}
                  >
                    {group.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Display Label</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('options_count')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Options
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : sortedAttributes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No attributes found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAttributes.map((attr) => {
                    const group = groups.find((g) => g.id === attr.group_id);
                    return (
                      <TableRow key={attr.id}>
                        <TableCell className="font-medium">{attr.name}</TableCell>
                        <TableCell>{attr.display_label || attr.name}</TableCell>
                        <TableCell>
                          {group ? (
                            <Badge variant="secondary">{group.name}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">No group</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{attr.data_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {attr.is_required ? <Badge>Required</Badge> : <Badge variant="secondary">Optional</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{optionCounts[attr.id] || 0}</Badge>
                        </TableCell>
                        <TableCell>{attr.display_order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {(attr.data_type === 'string' || attr.data_type === 'multi-select') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setManagingOptionsAttribute(attr);
                                  setIsOptionsOpen(true);
                                }}
                              >
                                <List className="mr-1 h-4 w-4" />
                                Options
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingAttribute(attr);
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAttribute(attr.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attribute</DialogTitle>
          </DialogHeader>
          {editingAttribute && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editingAttribute.name}
                  onChange={(e) => setEditingAttribute({ ...editingAttribute, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Display Label</Label>
                <Input
                  value={editingAttribute.display_label || ''}
                  onChange={(e) => setEditingAttribute({ ...editingAttribute, display_label: e.target.value })}
                />
              </div>
              <div>
                <Label>Data Type</Label>
                <Select
                  value={editingAttribute.data_type}
                  onValueChange={(value) => setEditingAttribute({ ...editingAttribute, data_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100] border border-border bg-popover shadow-lg">
                    <SelectItem value="string">Text (Dropdown)</SelectItem>
                    <SelectItem value="multi-select">Multi-Select</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Yes/No</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-required"
                  checked={editingAttribute.is_required}
                  onCheckedChange={(checked) =>
                    setEditingAttribute({ ...editingAttribute, is_required: checked as boolean })
                  }
                />
                <Label htmlFor="edit-required">Required field</Label>
              </div>
              <div>
                <Label>Group (optional)</Label>
                <Select
                  value={editingAttribute.group_id || 'none'}
                  onValueChange={(value) =>
                    setEditingAttribute({ ...editingAttribute, group_id: value === 'none' ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No group" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] border border-border bg-popover shadow-lg">
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateAttribute} className="w-full">
                Update Attribute
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Options Dialog */}
      <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
          <DialogHeader>
            <DialogTitle>Manage Options for "{managingOptionsAttribute?.name}"</DialogTitle>
          </DialogHeader>
          {managingOptionsAttribute && (
            <div className="flex flex-1 flex-col space-y-4 overflow-hidden">
              {/* Single Option Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter option value"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddOption();
                    }
                  }}
                />
                <Button onClick={handleAddOption}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
                <Button onClick={() => setIsBulkAddOpen(true)} variant="outline">
                  <Plus className="mr-1 h-4 w-4" />
                  Bulk Add
                </Button>
              </div>

              {/* Options Table with Fixed Height and Scroll */}
              <div className="flex flex-1 flex-col overflow-hidden rounded-lg border">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attributeOptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                            No options added yet. Add your first option above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        attributeOptions.map((option: unknown) => (
                          <TableRow key={option.id}>
                            <TableCell className="font-medium">{option.value}</TableCell>
                            <TableCell>
                              {option.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                            </TableCell>
                            <TableCell>{option.display_order}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleOptionActive(option.id, option.is_active)}
                                >
                                  {option.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteOption(option.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Add Options Dialog */}
      <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Add Options for "{managingOptionsAttribute?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Enter options (one per line)</Label>
              <Textarea
                placeholder="Paste multiple options here, one per line:&#10;Small&#10;Medium&#10;Large&#10;X-Large"
                value={bulkOptions}
                onChange={(e) => setBulkOptions(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                {bulkOptions.split('\n').filter((line) => line.trim()).length} option(s) to add
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBulkAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAddOptions}>
                <Plus className="mr-1 h-4 w-4" />
                Add All Options
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAttributesPage;
