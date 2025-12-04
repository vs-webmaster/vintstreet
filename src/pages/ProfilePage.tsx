import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CurrencySelector } from '@/components/CurrencySelector';
import { ProfileImageUpload } from '@/components/ProfileImageUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchOrCreateNotificationPreferences, updateNotificationPreferences } from '@/services/notifications';
import { updateProfile } from '@/services/users';
import { isFailure, isSuccess } from '@/types/api';

const ProfilePage = () => {
  const { user, profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
  });

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(profile?.avatar_url || '');
  const [notificationPreferences, setNotificationPreferences] = useState({
    order_updates: true,
    offer_updates: true,
    message_notifications: true,
    promotional_emails: false,
    seller_updates: true,
  });
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  // Fetch notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      try {
        const result = await fetchOrCreateNotificationPreferences(user.id);

        if (isSuccess(result) && result.data) {
          setNotificationPreferences({
            order_updates: result.data.order_updates,
            offer_updates: result.data.offer_updates,
            message_notifications: result.data.message_notifications,
            promotional_emails: result.data.promotional_emails,
            seller_updates: result.data.seller_updates,
          });
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
      } finally {
        setLoadingPreferences(false);
      }
    };

    fetchPreferences();
  }, [user]);

  // Update currentAvatarUrl when profile changes
  useEffect(() => {
    setCurrentAvatarUrl(profile?.avatar_url || '');
  }, [profile?.avatar_url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const result = await updateProfile(user.id, {
        username: formData.username,
        full_name: formData.full_name,
        bio: formData.bio,
      });

      if (isFailure(result)) throw result.error;

      await refetchProfile();

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (key: string, value: boolean) => {
    if (!user) return;

    try {
      const result = await updateNotificationPreferences(user.id, { [key]: value });

      if (isFailure(result)) throw result.error;

      setNotificationPreferences((prev) => ({ ...prev, [key]: value }));

      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preferences. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          <div className="space-y-8">
            {/* Profile Picture Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent>
                {user && (
                  <ProfileImageUpload
                    currentImageUrl={currentAvatarUrl}
                    userId={user.id}
                    userInitials={getInitials(profile?.full_name)}
                    onImageUpdate={(newUrl) => {
                      setCurrentAvatarUrl(newUrl);
                      refetchProfile();
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                        placeholder="Enter username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted" />
                    <p className="text-sm text-muted-foreground">
                      Email cannot be changed. Contact support if you need to update your email.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user_type">Account Type</Label>
                    <Input
                      id="user_type"
                      value={profile?.user_type || 'buyer'}
                      disabled
                      className="bg-muted capitalize"
                    />
                    <p className="text-sm text-muted-foreground">
                      Account type cannot be changed here. Use "Become a Seller" to upgrade your account.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="gap-2">
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">Preferred Currency</h4>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Choose your preferred currency for displaying prices
                    </p>
                  </div>
                  <div className="max-w-xs">
                    <CurrencySelector />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPreferences ? (
                  <p className="text-sm text-muted-foreground">Loading preferences...</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="order-updates" className="cursor-pointer text-base font-medium">
                          Order Updates
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about order status changes and delivery updates
                        </p>
                      </div>
                      <Switch
                        id="order-updates"
                        checked={notificationPreferences.order_updates}
                        onCheckedChange={(checked) => handleNotificationToggle('order_updates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="offer-updates" className="cursor-pointer text-base font-medium">
                          Offer Updates
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when offers are accepted or declined
                        </p>
                      </div>
                      <Switch
                        id="offer-updates"
                        checked={notificationPreferences.offer_updates}
                        onCheckedChange={(checked) => handleNotificationToggle('offer_updates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="message-notifications" className="cursor-pointer text-base font-medium">
                          Message Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">Get notified when you receive new messages</p>
                      </div>
                      <Switch
                        id="message-notifications"
                        checked={notificationPreferences.message_notifications}
                        onCheckedChange={(checked) => handleNotificationToggle('message_notifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="seller-updates" className="cursor-pointer text-base font-medium">
                          Seller Updates
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates from sellers you follow or interact with
                        </p>
                      </div>
                      <Switch
                        id="seller-updates"
                        checked={notificationPreferences.seller_updates}
                        onCheckedChange={(checked) => handleNotificationToggle('seller_updates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="promotional-emails" className="cursor-pointer text-base font-medium">
                          Promotional Emails
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive promotional emails and special offers</p>
                      </div>
                      <Switch
                        id="promotional-emails"
                        checked={notificationPreferences.promotional_emails}
                        onCheckedChange={(checked) => handleNotificationToggle('promotional_emails', checked)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-destructive p-4">
                  <div>
                    <h4 className="font-medium">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
