import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, User, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { replyToMessage, markAsReplied, flagMessage } from '@/services/messages';
import { isFailure } from '@/types/api';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  customer_name?: string;
}

interface MessageReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onReplySent: () => void;
}

export const MessageReplyModal = ({ isOpen, onClose, messages, onReplySent }: MessageReplyModalProps) => {
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const { user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const firstMessage = messages[0];

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(scrollToBottom, 100);
  }, [messages, isOpen]);

  const queryClient = useQueryClient();

  const handleSendReply = async () => {
    if (!replyText.trim() || !firstMessage || !user) {
      toast.error('Please enter a reply');
      return;
    }

    setIsSending(true);

    try {
      // Create the reply message
      const replyResult = await replyToMessage(user.id, firstMessage.id, {
        message: replyText.trim(),
      });

      if (isFailure(replyResult)) {
        throw replyResult.error;
      }

      // Update original message status to 'replied'
      const statusResult = await markAsReplied(firstMessage.id);
      if (isFailure(statusResult)) {
        console.error('Failed to update message status:', statusResult.error);
      }

      // Invalidate messages queries to refresh the thread and list
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      toast.success('Reply sent!');
      setReplyText('');
      onReplySent(); // Reload thread and list
      // Don't close the modal - keep it open after sending
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleReportMessage = async () => {
    if (!reportReason.trim() || !firstMessage || !user) {
      toast.error('Please provide a reason for reporting');
      return;
    }

    setIsReporting(true);

    try {
      const result = await flagMessage(firstMessage.id, reportReason.trim(), user.id);
      if (!result.success) throw new Error('Failed to flag message');

      toast.success('Message reported to administrators');
      setIsReportDialogOpen(false);
      setReportReason('');
      onReplySent(); // Refresh the thread
    } catch (error) {
      console.error('Error reporting message:', error);
      toast.error('Failed to report message');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Message Thread: {firstMessage?.subject}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">Conversation with {firstMessage?.customer_name}</p>
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

          {/* Message Thread */}
          <div ref={scrollContainerRef} className="flex-1 space-y-2 overflow-y-auto py-4">
            {messages
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[55%] rounded-lg p-2 ${
                      msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-medium">
                        {msg.sender_id === user?.id ? 'You' : msg.customer_name}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                    <p
                      className={`mt-1 text-xs ${
                        msg.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {format(new Date(msg.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          {/* Reply Section */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{replyText.length}/1000 characters</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose} disabled={isSending}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendReply} disabled={!replyText.trim() || isSending}>
                    <Send className="mr-2 h-4 w-4" />
                    {isSending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
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
    </>
  );
};
