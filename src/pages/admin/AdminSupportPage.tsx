import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  fetchAllSupportSettings,
  fetchAllFAQs,
  fetchAllContactCards,
  updateSupportSettings,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  createContactCard,
  updateContactCard,
  deleteContactCard,
} from '@/services/support';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

const AdminSupportPage = () => {
  const queryClient = useQueryClient();
  const [editingSettings, setEditingSettings] = useState(false);
  const [editingFaq, setEditingFaq] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [showAddFaqDialog, setShowAddFaqDialog] = useState(false);
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);

  // Fetch support settings
  const { data: settings } = useQuery({
    queryKey: ['support-settings-admin'],
    queryFn: async () => {
      const result = await fetchAllSupportSettings();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Fetch FAQs
  const { data: faqs } = useQuery({
    queryKey: ['support-faqs-admin'],
    queryFn: async () => {
      const result = await fetchAllFAQs();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Fetch contact cards
  const { data: contactCards } = useQuery({
    queryKey: ['support-contact-cards-admin'],
    queryFn: async () => {
      const result = await fetchAllContactCards();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (values: unknown) => {
      if (!settings?.id) throw new Error('Settings ID not found');
      const result = await updateSupportSettings(settings.id, values);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-settings-admin'] });
      toast.success('Settings updated successfully');
      setEditingSettings(false);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update settings: ' + error.message);
    },
  });

  // Update FAQ mutation
  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: unknown }) => {
      const result = await updateFAQ(id, values);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-faqs-admin'] });
      toast.success('FAQ updated successfully');
      setEditingFaq(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update FAQ: ' + error.message);
    },
  });

  // Add FAQ mutation
  const addFaqMutation = useMutation({
    mutationFn: async (values: unknown) => {
      const result = await createFAQ(values);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-faqs-admin'] });
      toast.success('FAQ added successfully');
      setShowAddFaqDialog(false);
    },
    onError: (error: unknown) => {
      toast.error('Failed to add FAQ: ' + error.message);
    },
  });

  // Delete FAQ mutation
  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFAQ(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-faqs-admin'] });
      toast.success('FAQ deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete FAQ: ' + error.message);
    },
  });

  // Update contact card mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: unknown }) => {
      const result = await updateContactCard(id, values);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-contact-cards-admin'] });
      toast.success('Contact card updated successfully');
      setEditingContact(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update contact card: ' + error.message);
    },
  });

  // Add contact card mutation
  const addContactMutation = useMutation({
    mutationFn: async (values: unknown) => {
      const result = await createContactCard(values);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-contact-cards-admin'] });
      toast.success('Contact card added successfully');
      setShowAddContactDialog(false);
    },
    onError: (error: unknown) => {
      toast.error('Failed to add contact card: ' + error.message);
    },
  });

  // Delete contact card mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteContactCard(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-contact-cards-admin'] });
      toast.success('Contact card deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete contact card: ' + error.message);
    },
  });

  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateSettingsMutation.mutate({
      page_title: formData.get('page_title'),
      page_description: formData.get('page_description'),
      meta_title: formData.get('meta_title'),
      meta_description: formData.get('meta_description'),
    });
  };

  const handleFaqSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addFaqMutation.mutate({
      question: formData.get('question'),
      answer: formData.get('answer'),
      display_order: parseInt(formData.get('display_order') as string) || 0,
      is_active: true,
    });
  };

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addContactMutation.mutate({
      title: formData.get('title'),
      description: formData.get('description'),
      icon: formData.get('icon'),
      email: formData.get('email') || null,
      phone: formData.get('phone') || null,
      link: formData.get('link') || null,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      is_active: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Support Page Management</h1>
          <p className="text-muted-foreground">Manage support page settings, FAQs, and contact cards</p>
        </div>

        {/* Page Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Page Settings</CardTitle>
              <CardDescription>Configure the support page title and description</CardDescription>
            </div>
            {!editingSettings && (
              <Button onClick={() => setEditingSettings(true)} size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingSettings ? (
              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="page_title">Page Title</Label>
                  <Input id="page_title" name="page_title" defaultValue={settings?.page_title || ''} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="page_description">Page Description</Label>
                  <Input
                    id="page_description"
                    name="page_description"
                    defaultValue={settings?.page_description || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title (SEO)</Label>
                  <Input id="meta_title" name="meta_title" defaultValue={settings?.meta_title || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description (SEO)</Label>
                  <Textarea
                    id="meta_description"
                    name="meta_description"
                    defaultValue={settings?.meta_description || ''}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingSettings(false)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Page Title:</span> {settings?.page_title}
                </div>
                <div>
                  <span className="font-semibold">Page Description:</span> {settings?.page_description}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQs Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>FAQs</CardTitle>
              <CardDescription>Manage frequently asked questions</CardDescription>
            </div>
            <Button onClick={() => setShowAddFaqDialog(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs?.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-medium">{faq.question}</TableCell>
                    <TableCell className="max-w-md truncate">{faq.answer}</TableCell>
                    <TableCell>{faq.display_order}</TableCell>
                    <TableCell>{faq.is_active ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingFaq(faq.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteFaqMutation.mutate(faq.id)}>
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

        {/* Contact Cards Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Contact Cards</CardTitle>
              <CardDescription>Manage contact methods</CardDescription>
            </div>
            <Button onClick={() => setShowAddContactDialog(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact Card
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactCards?.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">{card.title}</TableCell>
                    <TableCell className="max-w-md truncate">{card.description}</TableCell>
                    <TableCell>{card.icon}</TableCell>
                    <TableCell>{card.display_order}</TableCell>
                    <TableCell>{card.is_active ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingContact(card.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteContactMutation.mutate(card.id)}>
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

        {/* Add FAQ Dialog */}
        <Dialog open={showAddFaqDialog} onOpenChange={setShowAddFaqDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add FAQ</DialogTitle>
              <DialogDescription>Create a new frequently asked question</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFaqSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input id="question" name="question" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea id="answer" name="answer" required rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input id="display_order" name="display_order" type="number" defaultValue={0} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add FAQ</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddFaqDialog(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Contact Card Dialog */}
        <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Contact Card</DialogTitle>
              <DialogDescription>Create a new contact method</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon Name</Label>
                <Select name="icon" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mail">Mail</SelectItem>
                    <SelectItem value="MessageCircle">Message Circle</SelectItem>
                    <SelectItem value="Book">Book</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="HelpCircle">Help Circle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link (optional)</Label>
                <Input id="link" name="link" type="url" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input id="display_order" name="display_order" type="number" defaultValue={0} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Contact Card</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddContactDialog(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSupportPage;
