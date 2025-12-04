import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, User } from 'lucide-react';
import { format } from 'date-fns';
import { MessageReplyModal } from '@/components/MessageReplyModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { fetchReceivedMessages, fetchMessageThread, markAsRead, type Message } from '@/services/messages';
import { isSuccess, isFailure } from '@/types/api';

interface MessageWithProfile extends Message {
  customer_name: string;
  product_name?: string;
  product_image?: string;
}

export const MessagesTab = () => {
  const { user } = useAuth();
  const [selectedMessages, setSelectedMessages] = useState<MessageWithProfile[]>([]);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['seller-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const result = await fetchReceivedMessages(user.id);
      if (isFailure(result)) {
        throw result.error;
      }

      // Transform to MessageWithProfile format
      const messagesWithProfiles: MessageWithProfile[] = (result.data || []).map((msg) => ({
        ...msg,
        subject: msg.subject || '',
        customer_name: msg.sender?.full_name || msg.sender?.username || 'Unknown User',
        product_name: msg.listing?.product_name,
        product_image: msg.listing?.thumbnail || undefined,
      }));

      return messagesWithProfiles;
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread':
        return 'bg-red-500 text-white';
      case 'read':
        return 'bg-blue-500 text-white';
      case 'replied':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleViewThread = async (message: MessageWithProfile) => {
    // Fetch all messages in the thread
    const threadResult = await fetchMessageThread(message.id);
    if (isSuccess(threadResult)) {
      // Transform to MessageWithProfile format
      const messagesWithNames: MessageWithProfile[] = (threadResult.data || []).map((msg) => ({
        ...msg,
        subject: msg.subject || '',
        customer_name: msg.sender?.full_name || msg.sender?.username || 'Unknown User',
        product_name: msg.listing?.product_name,
        product_image: msg.listing?.thumbnail || undefined,
      }));

      setSelectedMessages(messagesWithNames);
      setIsReplyModalOpen(true);

      // Mark as read if unread
      if (message.status === 'unread') {
        await markAsRead(message.id);
        refetch();
      }
    }
  };

  const handleReplySuccess = async () => {
    // Reload the current thread
    if (selectedMessages.length > 0) {
      const firstMessage = selectedMessages[0];
      const threadResult = await fetchMessageThread(firstMessage.id);
      if (isSuccess(threadResult)) {
        // Transform to MessageWithProfile format
        const messagesWithNames: MessageWithProfile[] = (threadResult.data || []).map((msg) => ({
          ...msg,
          customer_name: msg.sender?.full_name || msg.sender?.username || 'Unknown User',
          product_name: msg.listing?.product_name,
          product_image: msg.listing?.thumbnail || undefined,
        }));

        setSelectedMessages(messagesWithNames);
      }
    }
    refetch(); // Also refetch the list
  };

  return (
    <>
      <Card className="p-6">
        <h3 className="mb-6 text-lg font-semibold text-foreground">Customer Messages</h3>

        {messages.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Customer messages will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="rounded-lg border p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{message.customer_name}</h4>
                      <p className="text-sm font-medium text-muted-foreground">{message.subject}</p>
                      {message.product_name && (
                        <div className="mt-2 flex items-center gap-2">
                          {message.product_image && (
                            <img
                              src={message.product_image}
                              alt={message.product_name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <p className="text-xs text-muted-foreground">
                            About: <span className="font-medium text-foreground">{message.product_name}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(message.status)}>{message.status.toUpperCase()}</Badge>
                </div>

                <p className="ml-13 mb-2 line-clamp-2 text-sm text-muted-foreground">{message.message}</p>
                <div className="ml-13 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => handleViewThread(message)}>
                    View & Reply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <MessageReplyModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        messages={selectedMessages.map((msg) => ({
          id: msg.id,
          sender_id: msg.sender_id,
          recipient_id: msg.recipient_id,
          subject: msg.subject || '',
          message: msg.message,
          status: msg.status || 'unread',
          created_at: msg.created_at,
          customer_name: msg.customer_name,
        }))}
        onReplySent={handleReplySuccess}
      />
    </>
  );
};
