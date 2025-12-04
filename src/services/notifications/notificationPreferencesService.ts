// Notification Preferences Service
// Centralized data access for user notification preferences

import { supabase } from '@/integrations/supabase/client';
import { withMaybeNull, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';
import { isSuccess } from '@/types/api';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  order_updates: boolean;
  offer_updates: boolean;
  message_notifications: boolean;
  promotional_emails: boolean;
  seller_updates: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateNotificationPreferencesInput {
  order_updates?: boolean;
  offer_updates?: boolean;
  message_notifications?: boolean;
  promotional_emails?: boolean;
  seller_updates?: boolean;
}

// Fetch notification preferences for a user
export async function fetchNotificationPreferences(userId: string): Promise<Result<NotificationPreferences | null>> {
  return withMaybeNull(async () => {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return { data: data as NotificationPreferences | null, error: null };
  }, 'fetchNotificationPreferences');
}

// Create default notification preferences for a user
export async function createNotificationPreferences(userId: string): Promise<Result<NotificationPreferences | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return { data: data as NotificationPreferences | null, error: null };
  }, 'createNotificationPreferences');
}

// Update notification preferences for a user
export async function updateNotificationPreferences(
  userId: string,
  input: UpdateNotificationPreferencesInput,
): Promise<Result<NotificationPreferences | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .update(input)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as NotificationPreferences | null, error: null };
  }, 'updateNotificationPreferences');
}

// Fetch or create notification preferences (convenience method)
export async function fetchOrCreateNotificationPreferences(
  userId: string,
): Promise<Result<NotificationPreferences | null>> {
  const existing = await fetchNotificationPreferences(userId);

  if (isSuccess(existing) && existing.data) {
    return existing;
  }

  return createNotificationPreferences(userId);
}
