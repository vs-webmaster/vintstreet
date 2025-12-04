// Messages Query Hooks
// React Query hooks for message data

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMessages,
  fetchMessageById,
  fetchMessageThread,
  fetchUnreadCount,
  fetchFlaggedMessages,
  createMessage,
  replyToMessage,
  markAsRead,
  markMultipleAsRead,
  flagMessage,
  unflagMessage,
  type MessageFilters,
  type CreateMessageInput,
  type ReplyMessageInput,
} from '@/services/messages';
import { isSuccess } from '@/types/api';

// Query key factory for messages
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (userId: string, filters: MessageFilters) => [...messageKeys.lists(), userId, filters] as const,
  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
  thread: (id: string) => [...messageKeys.all, 'thread', id] as const,
  unreadCount: (userId: string) => [...messageKeys.all, 'unread', userId] as const,
  flagged: () => [...messageKeys.all, 'flagged'] as const,
};

// Hook to fetch messages for a user
export function useMessages(userId: string | undefined, filters: MessageFilters = {}) {
  return useQuery({
    queryKey: messageKeys.list(userId || '', filters),
    queryFn: async () => {
      if (!userId) return [];
      const result = await fetchMessages(userId, filters);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

// Hook to fetch a single message
export function useMessage(messageId: string | undefined) {
  return useQuery({
    queryKey: messageKeys.detail(messageId || ''),
    queryFn: async () => {
      if (!messageId) throw new Error('Message ID required');
      const result = await fetchMessageById(messageId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!messageId,
    staleTime: 1000 * 60 * 1,
  });
}

// Hook to fetch message thread
export function useMessageThread(messageId: string | undefined) {
  return useQuery({
    queryKey: messageKeys.thread(messageId || ''),
    queryFn: async () => {
      if (!messageId) return [];
      const result = await fetchMessageThread(messageId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!messageId,
    staleTime: 1000 * 60 * 1,
  });
}

// Hook to fetch unread message count
export function useUnreadMessageCount(userId: string | undefined) {
  return useQuery({
    queryKey: messageKeys.unreadCount(userId || ''),
    queryFn: async () => {
      if (!userId) return 0;
      const result = await fetchUnreadCount(userId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hook to fetch flagged messages (admin)
export function useFlaggedMessages() {
  return useQuery({
    queryKey: messageKeys.flagged(),
    queryFn: async () => {
      const result = await fetchFlaggedMessages();
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    staleTime: 1000 * 60 * 1,
  });
}

// Mutation hook to send a message
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ senderId, input }: { senderId: string; input: CreateMessageInput }) => {
      const result = await createMessage(senderId, input);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { senderId, input }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount(input.recipient_id) });
    },
  });
}

// Mutation hook to reply to a message
export function useReplyToMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      senderId,
      parentMessageId,
      input,
    }: {
      senderId: string;
      parentMessageId: string;
      input: ReplyMessageInput;
    }) => {
      const result = await replyToMessage(senderId, parentMessageId, input);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { parentMessageId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.thread(parentMessageId) });
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
    },
  });
}

// Mutation hook to mark message as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const result = await markAsRead(messageId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}

// Mutation hook to mark multiple messages as read
export function useMarkMultipleAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      const result = await markMultipleAsRead(messageIds);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}

// Mutation hook to flag a message
export function useFlagMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      reason,
      reportedBy,
    }: {
      messageId: string;
      reason: string;
      reportedBy: string;
    }) => {
      const result = await flagMessage(messageId, reason, reportedBy);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}

// Mutation hook to unflag a message (admin)
export function useUnflagMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const result = await unflagMessage(messageId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.flagged() });
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}
