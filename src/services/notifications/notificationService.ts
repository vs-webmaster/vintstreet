// Notifications Service
// Centralized data access for notification operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface Notification {
  id: string;
  user_id: string;
  type: 'order_received' | 'order_shipped' | 'new_follow' | string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  order_id?: string | null;
  follower_id?: string | null;
}

export interface CreateNotificationInput {
  user_id: string;
  type: string;
  title: string;
  message: string;
  order_id?: string | null;
  follower_id?: string | null;
}

// Fetch all notifications for a user
export async function fetchNotifications(userId: string): Promise<Result<Notification[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Notification[], error: null };
  }, 'fetchNotifications');
}

// Fetch unread notifications for a user
export async function fetchUnreadNotifications(userId: string): Promise<Result<Notification[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Notification[], error: null };
  }, 'fetchUnreadNotifications');
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'markNotificationAsRead');
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { data: true, error: null };
  }, 'markAllNotificationsAsRead');
}

// Create a new notification
export async function createNotification(input: CreateNotificationInput): Promise<Result<Notification>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('notifications').insert([input]).select().single();

    if (error) throw error;
    return { data: data as Notification, error: null };
  }, 'createNotification');
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('notifications').delete().eq('id', notificationId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteNotification');
}
