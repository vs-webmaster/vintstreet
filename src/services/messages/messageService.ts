// Messages Service
// Centralized data access for message-related operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface MessageWithProfile {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  parent_message_id: string | null;
  is_flagged: boolean;
  reported_by: string | null;
  reported_at: string | null;
  report_reason: string | null;
  sender_name: string;
  recipient_name: string;
}

/**
 * Enriches messages with sender and recipient profile names.
 * Reduces N+1 queries by batching profile lookups.
 */
export async function enrichMessagesWithProfiles<T extends { sender_id: string; recipient_id: string }>(
  messages: T[],
): Promise<(T & { sender_name: string; recipient_name: string })[]> {
  if (!messages.length) return [];

  // Collect unique user IDs
  const userIds = [...new Set(messages.flatMap((m) => [m.sender_id, m.recipient_id]))];

  // Batch fetch all profiles at once
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, full_name, username')
    .in('user_id', userIds);

  // Create a lookup map
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name || p.username || 'Unknown User']));

  // Enrich messages
  return messages.map((msg) => ({
    ...msg,
    sender_name: profileMap.get(msg.sender_id) ?? 'Unknown User',
    recipient_name: profileMap.get(msg.recipient_id) ?? 'Unknown User',
  }));
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject?: string | null;
  message: string;
  status?: string | null;
  parent_message_id?: string | null;
  listing_id?: string | null;
  order_id?: string | null;
  is_flagged?: boolean | null;
  reported_by?: string | null;
  reported_at?: string | null;
  report_reason?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  sender?: {
    user_id: string;
    username?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  recipient?: {
    user_id: string;
    username?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  listing?: {
    id: string;
    product_name: string;
    thumbnail?: string | null;
  } | null;
}

export interface MessageFilters {
  status?: string;
  isFlagged?: boolean;
  listingId?: string;
  parentMessageId?: string | null;
}

export interface CreateMessageInput {
  recipient_id: string;
  subject?: string;
  message: string;
  listing_id?: string;
  order_id?: string;
  parent_message_id?: string | null;
}

export interface ReplyMessageInput {
  message: string;
}

const MESSAGE_SELECT = `
  *,
  sender:profiles!messages_sender_id_fkey (user_id, username, full_name, avatar_url),
  recipient:profiles!messages_recipient_id_fkey (user_id, username, full_name, avatar_url),
  listing:listings!messages_listing_id_fkey (id, product_name, thumbnail)
`;

// Fetch messages for a user
export async function fetchMessages(userId: string, filters: MessageFilters = {}): Promise<Result<Message[]>> {
  return withErrorHandling(async () => {
    let query = supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (filters.status !== undefined) {
      query = query.eq('status', filters.status);
    }
    if (filters.isFlagged !== undefined) {
      query = query.eq('is_flagged', filters.isFlagged);
    }
    if (filters.listingId) {
      query = query.eq('listing_id', filters.listingId);
    }
    if (filters.parentMessageId !== undefined) {
      if (filters.parentMessageId === null) {
        query = query.is('parent_message_id', null);
      } else {
        query = query.eq('parent_message_id', filters.parentMessageId);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as unknown as Message[], error: null };
  }, 'fetchMessages');
}

// Fetch a single message by ID
export async function fetchMessageById(messageId: string): Promise<Result<Message>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('messages').select('*').eq('id', messageId).single();

    if (error) throw error;
    return { data: data as unknown as Message, error: null };
  }, 'fetchMessageById');
}

// Fetch messages received by a user (parent messages only)
export async function fetchReceivedMessages(
  recipientId: string,
  filters: { status?: string } = {},
): Promise<Result<Message[]>> {
  return withErrorHandling(async () => {
    let query = supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .eq('recipient_id', recipientId)
      .is('parent_message_id', null)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as unknown as Message[], error: null };
  }, 'fetchReceivedMessages');
}

// Fetch message thread (original + replies)
export async function fetchMessageThread(messageId: string): Promise<Result<Message[]>> {
  return withErrorHandling(async () => {
    // Get the original message and all replies
    const { data, error } = await supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .or(`id.eq.${messageId},parent_message_id.eq.${messageId}`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as unknown as Message[], error: null };
  }, 'fetchMessageThread');
}

// Fetch unread message count for a user
export async function fetchUnreadCount(userId: string): Promise<Result<number>> {
  return withErrorHandling(async () => {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('status', 'unread');

    if (error) throw error;
    return { data: count || 0, error: null };
  }, 'fetchUnreadCount');
}

// Fetch flagged messages (admin)
export async function fetchFlaggedMessages(): Promise<Result<Message[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('is_flagged', true)
      .order('reported_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as unknown as Message[], error: null };
  }, 'fetchFlaggedMessages');
}

// Create a new message
export async function createMessage(senderId: string, input: CreateMessageInput): Promise<Result<Message | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: input.recipient_id,
        subject: input.subject,
        message: input.message,
        listing_id: input.listing_id,
        order_id: input.order_id,
        parent_message_id: input.parent_message_id || null,
        status: 'unread',
      })
      .select('*')
      .single();

    if (error) throw error;
    return { data: data as unknown as Message, error: null };
  }, 'createMessage');
}

// Reply to a message
export async function replyToMessage(
  senderId: string,
  parentMessageId: string,
  input: ReplyMessageInput,
): Promise<Result<Message | null>> {
  return withMutation(async () => {
    // First get the parent message to get recipient
    const { data: parent, error: parentError } = await supabase
      .from('messages')
      .select('sender_id, recipient_id, subject, listing_id')
      .eq('id', parentMessageId)
      .single();

    if (parentError) throw parentError;

    // Determine recipient (opposite of sender)
    const recipientId = parent.sender_id === senderId ? parent.recipient_id : parent.sender_id;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        subject: parent.subject ? `Re: ${parent.subject.replace(/^Re: /, '')}` : null,
        message: input.message,
        parent_message_id: parentMessageId,
        listing_id: parent.listing_id,
        status: 'unread',
      })
      .select('*')
      .single();

    if (error) throw error;
    return { data: data as unknown as Message, error: null };
  }, 'replyToMessage');
}

// Mark message as read
export async function markAsRead(messageId: string): Promise<Result<boolean | null>> {
  return withMutation(async () => {
    const { error } = await supabase.from('messages').update({ status: 'read' }).eq('id', messageId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'markAsRead');
}

// Mark multiple messages as read
export async function markMultipleAsRead(messageIds: string[]): Promise<Result<boolean | null>> {
  return withMutation(async () => {
    const { error } = await supabase.from('messages').update({ status: 'read' }).in('id', messageIds);

    if (error) throw error;
    return { data: true, error: null };
  }, 'markMultipleAsRead');
}

// Flag a message for review
export async function flagMessage(
  messageId: string,
  reason: string,
  reportedBy: string,
): Promise<Result<boolean | null>> {
  return withMutation(async () => {
    const { error } = await supabase
      .from('messages')
      .update({
        is_flagged: true,
        report_reason: reason,
        reported_by: reportedBy,
        reported_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'flagMessage');
}

// Unflag a message (admin)
export async function unflagMessage(messageId: string): Promise<Result<boolean | null>> {
  return withMutation(async () => {
    const { error } = await supabase
      .from('messages')
      .update({
        is_flagged: false,
        report_reason: null,
        reported_by: null,
        reported_at: null,
      })
      .eq('id', messageId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'unflagMessage');
}

// Mark message as replied (used when a reply is sent)
// Fetch messages between two specific users
export async function fetchMessagesBetweenUsers(userId1: string, userId2: string): Promise<Result<Message[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .or(
        `and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`,
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as unknown as Message[], error: null };
  }, 'fetchMessagesBetweenUsers');
}

export async function markAsReplied(messageId: string): Promise<Result<boolean | null>> {
  return withMutation(async () => {
    const { error } = await supabase.from('messages').update({ status: 'replied' }).eq('id', messageId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'markAsReplied');
}
