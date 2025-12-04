import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Package, Users } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from '@/services/notifications';
import { isFailure } from '@/types/api';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order_received':
    case 'order_shipped':
      return Package;
    case 'new_follow':
      return Users;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'order_received':
    case 'order_shipped':
      return 'text-blue-600';
    case 'new_follow':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
};

const getActionUrl = (notification: Notification) => {
  if (notification.type === 'order_received' || notification.type === 'order_shipped') {
    return '/my-orders';
  }
  if (notification.type === 'new_follow' && notification.follower_id) {
    return `/seller/${notification.follower_id}`;
  }
  return undefined;
};

const NotificationCard = ({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) => {
  const IconComponent = getNotificationIcon(notification.type);
  const actionUrl = getActionUrl(notification);
  const timeAgo = new Date(notification.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className={`transition-all hover:shadow-md ${!notification.read ? 'ring-2 ring-primary/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className={`rounded-full bg-muted p-2 ${getNotificationColor(notification.type)}`}>
            <IconComponent className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h4 className="text-sm font-semibold">{notification.title}</h4>
                  {!notification.read && (
                    <Badge variant="destructive" className="px-1.5 py-0.5 text-xs">
                      New
                    </Badge>
                  )}
                </div>
                <p className="mb-2 text-sm text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
              </div>

              {!notification.read && (
                <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification.id)} className="text-xs">
                  Mark as read
                </Button>
              )}
            </div>

            {actionUrl && (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => (window.location.href = actionUrl)}>
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const result = await fetchNotifications(user.id);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!user,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await markNotificationAsRead(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const result = await markAllNotificationsAsRead(user.id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark all notifications as read');
    },
  });

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const filterNotifications = (filter: string) => {
    switch (filter) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'orders':
        return notifications.filter((n) => n.type === 'order_received' || n.type === 'order_shipped');
      case 'follows':
        return notifications.filter((n) => n.type === 'new_follow');
      default:
        return notifications;
    }
  };

  const filteredNotifications = filterNotifications(activeTab);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
              <p className="text-muted-foreground">Stay updated with your orders and account activity</p>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  Mark All Read
                </Button>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <div className="mt-4 rounded-lg border bg-primary/10 p-4">
              <p className="text-sm">
                You have <strong>{unreadCount}</strong> unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="all" className="gap-2">
              All
              <Badge variant="secondary">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              Unread
              {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              Orders
              <Badge variant="secondary">
                {notifications.filter((n) => n.type === 'order_received' || n.type === 'order_shipped').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="follows" className="gap-2">
              Follows
              <Badge variant="secondary">{notifications.filter((n) => n.type === 'new_follow').length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-8">
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} onMarkAsRead={markAsRead} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Bell className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No notifications</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'all'
                    ? "You're all caught up! No notifications to show."
                    : `No ${activeTab} notifications found.`}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
