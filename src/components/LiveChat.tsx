/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import AgoraRTM from 'agora-rtm-sdk';
import { Send, Smile, Gift, Heart } from 'lucide-react';
import randomColor from 'randomcolor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAgoraRTMConfig, clearAgoraRTMConfigCache } from '@/config/agora';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'gift' | 'join' | 'purchase';
  avatar?: string;
  color?: string;
}

interface RtmClient {
  login: (params: { uid: string; token: string | null }) => Promise<void>;
  createChannel: (channelId: string) => RtmChannel;
  setLocalUserAttributes: (attributes: { name: string; color: string }) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUserAttributes: (uid: string) => Promise<any>;
}

interface RtmChannel {
  join: () => Promise<void>;
  sendMessage: (message: { text: string }) => Promise<void>;
  on: (event: string, callback: (data: unknown, uid: string) => void) => void;
}

interface RtmMessage {
  messageType: string;
  text: string;
}

// Helper function to generate random ID
const makeid = (length: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

interface LiveChatProps {
  streamId: string;
}

const LiveChat = ({ streamId }: LiveChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // RTM related refs and state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agoraRTMConfig, setAgoraRTMConfig] = useState<any>(null);
  const clientRef = useRef<RtmClient | null>(null);
  const channelRef = useRef<RtmChannel | null>(null);
  const userColorRef = useRef<string>(randomColor({ luminosity: 'dark' }));
  const userIdRef = useRef<string>(makeid(5));
  const currentUserRef = useRef<string>('');

  // Scroll area ref for auto-scrolling
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth',
          });
        }, 100);
      }
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getAgoraRTMConfig({
          channelName: streamId,
          uid: userIdRef.current!,
        });

        // Validate App ID format on frontend
        if (!config.appId || !/^[a-f0-9]{32}$/i.test(config.appId)) {
          throw new Error(`Invalid App ID format: ${config.appId}. Expected 32 hexadecimal characters.`);
        }

        setAgoraRTMConfig(config);
      } catch (error) {
        console.error('Failed to load Agora RTM config:', error);
      }
    };

    loadConfig();

    // Clear config cache on unmount
    return () => {
      clearAgoraRTMConfigCache();
    };
  }, []);

  // Initialize RTM client and join channel
  useEffect(() => {
    const initRtm = async () => {
      setIsLoading(true);
      try {
        // Create RTM client with App ID
        const client = AgoraRTM.createInstance(agoraRTMConfig.appId) as RtmClient;
        clientRef.current = client;

        // Generate username based on user info or random
        const username = user?.email?.split('@')[0] || `User_${userIdRef.current}`;
        currentUserRef.current = username;

        // Login to RTM
        await client.login({
          uid: userIdRef.current,
          token: agoraRTMConfig.token,
        });

        // Create and join channel
        const channel = client.createChannel(streamId);
        channelRef.current = channel;
        await channel.join();

        // Set user attributes
        await client.setLocalUserAttributes({
          name: username,
          color: userColorRef.current,
        });

        // Listen for channel messages
        channel.on('ChannelMessage', async (data: RtmMessage, uid: string) => {
          if (data.messageType === 'TEXT') {
            try {
              const userAttributes = await client.getUserAttributes(uid);
              const newMessage: ChatMessage = {
                id: Date.now().toString() + uid,
                username: userAttributes.name || `User_${uid}`,
                message: data.text,
                timestamp: new Date(),
                type: 'message',
                color: userAttributes.color || randomColor({ luminosity: 'dark' }),
              };
              setMessages((prev) => [...prev, newMessage]);
            } catch (error) {
              console.error('Error getting user attributes:', error);
              // Fallback message without user attributes
              const newMessage: ChatMessage = {
                id: Date.now().toString() + uid,
                username: `User_${uid}`,
                message: data.text,
                timestamp: new Date(),
                type: 'message',
                color: randomColor({ luminosity: 'dark' }),
              };
              setMessages((prev) => [...prev, newMessage]);
            }
          }
        });

        setIsConnected(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize RTM:', error);
        setIsLoading(false);
      }
    };

    if (streamId && agoraRTMConfig) {
      initRtm();
    } else {
      setIsLoading(false);
      setIsConnected(false);
    }

    // Cleanup on unmount
    return () => {
      setIsLoading(false);
      setIsConnected(false);
      if (channelRef.current) {
        try {
          // Note: RTM SDK doesn't have a leave method, connection is cleaned up on logout
        } catch (error) {
          console.error('Error during RTM cleanup:', error);
        }
      }
      if (clientRef.current) {
        try {
          // Note: logout method might not be available in all versions
        } catch (error) {
          console.error('Error during RTM client cleanup:', error);
        }
      }
    };
  }, [streamId, user, agoraRTMConfig]);

  const sendMessage = async () => {
    if (newMessage.trim() && channelRef.current && isConnected && !isLoading) {
      try {
        // Send message through RTM
        await channelRef.current.sendMessage({ text: newMessage });

        // Add message to local state for immediate feedback
        const message: ChatMessage = {
          id: Date.now().toString(),
          username: currentUserRef.current,
          message: newMessage,
          timestamp: new Date(),
          type: 'message',
          color: userColorRef.current,
        };
        setMessages((prev) => [...prev, message]);
        setNewMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (type: ChatMessage['type']) => {
    switch (type) {
      case 'gift':
        return <Gift className="h-4 w-4 text-live-indicator" />;
      case 'purchase':
        return <Heart className="h-4 w-4 text-live-indicator" />;
      default:
        return null;
    }
  };

  return (
    <Card className="flex h-full flex-1 flex-col rounded-none border-none bg-chat-background">
      <div className="flex h-20 flex-col justify-center border-b border-border p-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-foreground">Live Chat</h3>
          <div
            className={`h-2 w-2 rounded-full ${
              isLoading ? 'animate-pulse bg-yellow-500' : isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {isLoading ? 'Connecting...' : isConnected ? `${messages.length} messages` : 'Disconnected'}
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-auto">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-2 text-sm">
                {msg.avatar && (
                  <img src={msg.avatar} alt={msg.username} className="mt-1 h-6 w-6 rounded-full object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: msg.color || (msg.username === currentUserRef.current ? userColorRef.current : '#666'),
                      }}
                    >
                      {msg.username}
                    </span>
                    {getMessageIcon(msg.type)}
                    <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p
                    className={`break-all text-sm ${
                      msg.type === 'purchase'
                        ? 'font-medium text-live-indicator'
                        : msg.type === 'gift'
                          ? 'text-live-indicator'
                          : 'text-foreground'
                    }`}
                  >
                    {msg.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-border p-4">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isLoading ? 'Connecting...' : isConnected ? 'Type a message...' : 'Disconnected'}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && isConnected && sendMessage()}
              disabled={isLoading || !isConnected}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={isLoading || !isConnected || !newMessage.trim()}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-xs">
              <Smile className="mr-1 h-4 w-4" />
              Emoji
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LiveChat;
