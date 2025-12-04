import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, ArrowRight, AlertTriangle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { MessageReplyModal } from '@/components/MessageReplyModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  fetchFlaggedMessages,
  fetchMessageThread,
  enrichMessagesWithProfiles,
  type MessageWithProfile,
} from '@/services/messages';
import { isFailure } from '@/types/api';

export const AdminMessagesTab = () => {
  const [selectedMessages, setSelectedMessages] = useState<MessageWithProfile[]>([]);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['admin-flagged-messages'],
    queryFn: async () => {
      const result = await fetchFlaggedMessages();
      if (isFailure(result)) throw result.error;
      return enrichMessagesWithProfiles(result.data || []);
    },
  });

  // Filter messages based on search query
  const filteredMessages = messages.filter(
    (msg) =>
      msg.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
    const rootMessageId = message.parent_message_id || message.id;

    const result = await fetchMessageThread(rootMessageId);
    if (isFailure(result)) {
      console.error('Error fetching thread:', result.error);
      return;
    }

    const messagesWithNames = await enrichMessagesWithProfiles(result.data || []);
    setSelectedMessages(
      messagesWithNames.map((msg) => ({
        ...msg,
        subject: msg.subject || '',
      })) as MessageWithProfile[],
    );
    setIsReplyModalOpen(true);
  };

  const handleReplySuccess = async () => {
    if (selectedMessages.length > 0) {
      const firstMessage = selectedMessages[0];
      const rootMessageId = firstMessage.parent_message_id || firstMessage.id;

      const result = await fetchMessageThread(rootMessageId);
      if (!isFailure(result) && result.data) {
        const messagesWithNames = await enrichMessagesWithProfiles(result.data);
        setSelectedMessages(messagesWithNames as MessageWithProfile[]);
      }
    }
    refetch();
  };

  return (
    <>
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Flagged Messages</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search by user or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No flagged messages</p>
            <p className="mt-1 text-sm text-muted-foreground">Reported messages will appear here</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="py-8 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No messages found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{message.sender_name}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{message.recipient_name}</span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{message.subject}</p>
                      {message.report_reason && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          <strong>Report:</strong> {message.report_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-600 text-white">FLAGGED</Badge>
                    <Badge className={getStatusColor(message.status)}>{message.status.toUpperCase()}</Badge>
                  </div>
                </div>

                <p className="ml-13 mb-2 line-clamp-2 text-sm text-muted-foreground">{message.message}</p>
                <div className="ml-13 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => handleViewThread(message as MessageWithProfile)}>
                    View Thread
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
        messages={selectedMessages}
        onReplySent={handleReplySuccess}
      />
    </>
  );
};
