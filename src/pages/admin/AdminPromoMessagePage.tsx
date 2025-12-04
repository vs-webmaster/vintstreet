import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchPromoMessage, updatePromoMessage } from '@/services/content';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

const AdminPromoMessagePage = () => {
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPromoMessageAsync();
  }, []);

  const fetchPromoMessageAsync = async () => {
    try {
      const result = await fetchPromoMessage();
      if (isFailure(result)) throw result.error;

      if (result.data) {
        setMessage(result.data.message);
        setIsActive(result.data.is_active);
      }
    } catch (error) {
      console.error('Error fetching promo message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updatePromoMessage(message, isActive);
      if (isFailure(result)) throw result.error;

      toast.success('Promo message updated successfully');
    } catch (error) {
      console.error('Error saving promo message:', error);
      toast.error('Failed to save promo message');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Promo Message</h1>
          <p className="text-muted-foreground">Manage the promotional message in the header top bar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Header Promo Message</CardTitle>
            <CardDescription>This message appears in the top bar of the website header</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter promo message"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Display message on website
              </Label>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPromoMessagePage;
