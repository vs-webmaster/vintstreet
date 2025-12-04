import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, User, Send, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Header from '@/components/Header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import {
  markMultipleAsRead,
  createMessage,
  fetchMessages,
  flagMessage,
  enrichMessagesWithProfiles,
  type Message,
} from '@/services/messages';
import { isFailure } from '@/types/api';

interface MessageThread {
  id: string;
  subject: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  messages: (Message & { sender_name: string; recipient_name: string })[];
}

export default function MyMessagesPage() {
  const { user } = useAuth();
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const { data: threads = [], refetch } = useQuery({
    queryKey: ['message-threads', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch messages using service
      const messagesResult = await fetchMessages(user.id);
      if (isFailure(messagesResult)) {
        throw messagesResult.error;
      }

      const messages = messagesResult.data;

      // Enrich messages with profile names
      const enrichedMessages = await enrichMessagesWithProfiles(messages);

      // Group messages by thread (same subject and participants)
      const threadMap = new Map<string, MessageThread>();

      for (const msg of enrichedMessages) {
        const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const threadKey = `${msg.subject || ''}-${otherUserId}`;

        if (!threadMap.has(threadKey)) {
          // Get other user's name from enriched message
          const otherUserName = msg.sender_id === user.id ? msg.recipient_name : msg.sender_name;

          threadMap.set(threadKey, {
            id: threadKey,
            subject: msg.subject || '',
            other_user_id: otherUserId,
            other_user_name: otherUserName,
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: 0,
            messages: [],
          });
        }

        const thread = threadMap.get(threadKey)!;
        thread.messages.push(msg as Message & { sender_name: string; recipient_name: string });

        // Count unread messages
        if (msg.recipient_id === user.id && msg.status === 'unread') {
          thread.unread_count++;
        }
      }

      return Array.from(threadMap.values());
    },
    enabled: !!user,
  });

  const handleOpenThread = async (thread: MessageThread) => {
    setSelectedThread(thread);

    // Mark messages as read
    const unreadMessageIds = thread.messages
      .filter((msg) => msg.recipient_id === user?.id && msg.status === 'unread')
      .map((msg) => msg.id);

    if (unreadMessageIds.length > 0) {
      const result = await markMultipleAsRead(unreadMessageIds);
      if (isFailure(result)) {
        console.error('Failed to mark messages as read:', result.error);
      }
      refetch();
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread || !user) return;

    setIsSending(true);
    try {
      const result = await createMessage(user.id, {
        recipient_id: selectedThread.other_user_id,
        subject: selectedThread.subject,
        message: replyText.trim(),
        parent_message_id: selectedThread.messages[0]?.id || null,
      });

      if (isFailure(result)) throw result.error;

      toast.success('Reply sent!');
      setReplyText('');
      refetch();
      setSelectedThread(null);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleReportMessage = async () => {
    if (!reportReason.trim() || !selectedThread || !user) {
      toast.error('Please provide a reason for reporting');
      return;
    }

    setIsReporting(true);

    try {
      // Get the first message in the thread to flag
      const firstMessage = selectedThread.messages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )[0];

      if (!firstMessage) throw new Error('No message found');

      const result = await flagMessage(firstMessage.id, reportReason.trim(), user.id);
      if (!result.success) throw new Error('Failed to flag message');

      toast.success('Message reported to administrators');
      setIsReportDialogOpen(false);
      setReportReason('');
      setSelectedThread(null);
      refetch();
    } catch (error) {
      console.error('Error reporting message:', error);
      toast.error('Failed to report message');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">My Messages</h1>

        {threads.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No messages yet</p>
              <p className="mt-2 text-sm text-muted-foreground">Your message threads will appear here</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Card
                key={thread.id}
                className="cursor-pointer p-4 transition-colors hover:bg-accent/50"
                onClick={() => handleOpenThread(thread)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="truncate font-semibold">{thread.other_user_name}</h3>
                        {thread.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {thread.unread_count} new
                          </Badge>
                        )}
                      </div>
                      <p className="mb-1 text-sm font-medium text-muted-foreground">{thread.subject}</p>
                      <p className="truncate text-sm text-muted-foreground">{thread.last_message}</p>
                    </div>
                  </div>
                  <span className="ml-4 whitespace-nowrap text-xs text-muted-foreground">
                    {format(new Date(thread.last_message_time), 'MMM d, h:mm a')}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Thread Dialog */}
      <Dialog open={!!selectedThread} onOpenChange={() => setSelectedThread(null)}>
        <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{selectedThread?.subject}</DialogTitle>
                <p className="text-sm text-muted-foreground">Conversation with {selectedThread?.other_user_name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReportDialogOpen(true)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Flag className="mr-1 h-4 w-4" />
                Report
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            {selectedThread?.messages
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                    <p
                      className={`mt-1 text-xs ${
                        msg.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                className="flex-1"
              />
              <Button
                onClick={handleSendReply}
                disabled={!replyText.trim() || isSending}
                size="icon"
                className="h-auto"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <AlertDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Message</AlertDialogTitle>
            <AlertDialogDescription>
              This will flag the message for administrator review. Please provide a reason for reporting this
              conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason for reporting</Label>
            <Textarea
              id="report-reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe why you're reporting this message..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{reportReason.length}/500 characters</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReportMessage}
              disabled={!reportReason.trim() || isReporting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isReporting ? 'Reporting...' : 'Report Message'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
