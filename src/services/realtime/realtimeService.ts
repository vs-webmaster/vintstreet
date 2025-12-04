// Realtime Service
// Centralized realtime subscription service for Supabase Realtime

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface PostgresChangeFilter {
  schema?: string;
  table: string;
  filter?: string;
  event?: RealtimeEvent;
}

export interface PostgresChangePayload<T = unknown> {
  new?: T;
  old?: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

/**
 * Subscribe to postgres changes
 * @param channelName - Unique channel name
 * @param filter - Filter configuration for the subscription
 * @param callback - Callback function to handle changes
 * @returns Unsubscribe function
 */
export function subscribeToPostgresChanges<T = unknown>(
  channelName: string,
  filter: PostgresChangeFilter,
  callback: (payload: PostgresChangePayload<T>) => void,
): () => void {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: filter.event || '*',
        schema: filter.schema || 'public',
        table: filter.table,
        filter: filter.filter,
      },
      (payload: unknown) => {
        callback({
          new: payload.new as T | undefined,
          old: payload.old as T | undefined,
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        });
      },
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/**
 * Subscribe to multiple postgres changes on the same channel
 * @param channelName - Unique channel name
 * @param subscriptions - Array of subscription configurations
 * @returns Unsubscribe function
 */
export function subscribeToMultiplePostgresChanges(
  channelName: string,
  subscriptions: Array<{
    filter: PostgresChangeFilter;
    callback: (payload: PostgresChangePayload) => void;
  }>,
): () => void {
  let channel = supabase.channel(channelName);

  subscriptions.forEach(({ filter, callback }) => {
    channel = channel.on(
      'postgres_changes',
      {
        event: filter.event || '*',
        schema: filter.schema || 'public',
        table: filter.table,
        filter: filter.filter,
      },
      (payload: unknown) => {
        callback({
          new: payload.new,
          old: payload.old,
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        });
      },
    );
  });

  channel.subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/**
 * Get a raw Supabase channel (for advanced use cases)
 * @param channelName - Unique channel name
 * @returns Supabase RealtimeChannel
 */
export function getChannel(channelName: string): RealtimeChannel {
  return supabase.channel(channelName);
}
