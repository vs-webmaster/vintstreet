import { useState } from 'react';
import { Video, VideoOff, Mic, MicOff, Settings, Users, Radio, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAgora } from '@/hooks/useAgora';

interface StreamControlsProps {
  streamId: string;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

const StreamControls = ({ streamId, onStreamStart, onStreamEnd }: StreamControlsProps) => {
  const [isStreaming, setIsStreaming] = useState(false);

  const { isConnected, isVideoEnabled, isAudioEnabled, remoteUsers, startVideo, stopVideo, startAudio, stopAudio } =
    useAgora({
      channelName: streamId,
      isHost: true,
    });

  const handleStartStream = async () => {
    try {
      await Promise.all([startVideo(), startAudio()]);
      setIsStreaming(true);
      onStreamStart?.();
    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  };

  const handleEndStream = async () => {
    try {
      await Promise.all([stopVideo(), stopAudio()]);
      setIsStreaming(false);
      onStreamEnd?.();
    } catch (error) {
      console.error('Failed to end stream:', error);
    }
  };

  const toggleVideo = async () => {
    if (isVideoEnabled) {
      await stopVideo();
    } else {
      await startVideo();
    }
  };

  const toggleAudio = async () => {
    if (isAudioEnabled) {
      await stopAudio();
    } else {
      await startAudio();
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-foreground">Stream Controls</h2>
          {isStreaming && (
            <Badge className="bg-live-indicator text-white">
              <Radio className="mr-1 h-3 w-3" />
              LIVE
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{remoteUsers.length} viewers</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant={isVideoEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={toggleVideo}
            disabled={!isConnected}
          >
            {isVideoEnabled ? <Video className="mr-2 h-4 w-4" /> : <VideoOff className="mr-2 h-4 w-4" />}
            Camera
          </Button>

          <Button
            variant={isAudioEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={toggleAudio}
            disabled={!isConnected}
          >
            {isAudioEnabled ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
            Microphone
          </Button>

          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          {!isStreaming ? (
            <Button
              onClick={handleStartStream}
              disabled={!isConnected}
              className="bg-live-indicator text-white hover:bg-live-indicator/90"
            >
              <Radio className="mr-2 h-4 w-4" />
              Start Stream
            </Button>
          ) : (
            <Button onClick={handleEndStream} variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              End Stream
            </Button>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="mt-4 rounded-lg bg-muted p-3">
          <p className="text-sm text-muted-foreground">Connecting to streaming service...</p>
        </div>
      )}
    </Card>
  );
};

export default StreamControls;
