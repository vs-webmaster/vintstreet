import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Video, VideoOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAgora } from '@/hooks/useAgora';

interface StreamPlayerProps {
  streamId: string;
  title: string;
  streamerName: string;
  isLive: boolean;
  viewerCount: number;
  isHost?: boolean;
}
const StreamPlayer = ({ streamId, title, streamerName, isLive, viewerCount, isHost = false }: StreamPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const {
    isConnected,
    isVideoEnabled,
    isAudioEnabled,
    remoteUsers,
    configLoaded,
    configError,
    startVideo,
    stopVideo,
    startAudio,
    stopAudio,
    playRemoteVideo,
    playLocalVideo,
  } = useAgora({
    channelName: streamId,
    isHost,
  });
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls]);

  // Handle remote video playback
  useEffect(() => {
    if (remoteUsers.length > 0 && remoteVideoRef.current) {
      const remoteUid = remoteUsers[0]; // Play first remote user's video
      playRemoteVideo(remoteUid, remoteVideoRef.current);
    }
  }, [remoteUsers, playRemoteVideo]);

  // Handle local video playback for hosts
  useEffect(() => {
    if (isHost && isVideoEnabled && videoContainerRef.current) {
      playLocalVideo(videoContainerRef.current);
    }
  }, [isHost, isVideoEnabled, playLocalVideo]);
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };
  const handleMute = async () => {
    if (isHost) {
      if (isAudioEnabled) {
        await stopAudio();
      } else {
        await startAudio();
      }
    }
    setIsMuted(!isMuted);
    setShowControls(true);
  };
  const handleVideoToggle = async () => {
    if (isHost) {
      if (isVideoEnabled) {
        await stopVideo();
      } else {
        await startVideo();
      }
    }
    setShowControls(true);
  };
  return (
    <Card className="relative w-full max-w-full overflow-hidden bg-black">
      {/* Agora Video Container */}
      <div
        className="relative aspect-[16/9] max-h-[50vh] cursor-pointer overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 md:aspect-[9/16] md:max-h-none"
        onClick={() => setShowControls(true)}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setTimeout(() => setShowControls(false), 2000)}
      >
        {/* Remote video container (for viewers) */}
        {!isHost && (
          <div
            ref={remoteVideoRef}
            className="absolute inset-0 h-full w-full"
            style={{
              backgroundColor: remoteUsers.length === 0 ? 'transparent' : '#000',
            }}
          />
        )}

        {/* Local video container (for hosts) */}
        {isHost && (
          <div
            ref={videoContainerRef}
            className="absolute inset-0 h-full w-full"
            style={{
              backgroundColor: isVideoEnabled ? '#000' : 'transparent',
            }}
          />
        )}

        {/* Connection status and fallback UI */}
        {(!configLoaded || !isConnected || (remoteUsers.length === 0 && !isHost) || (isHost && !isVideoEnabled)) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-center text-white">
            <div>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                {configError ? (
                  <div className="h-6 w-6 rounded-full bg-red-500" />
                ) : !configLoaded ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent bg-white/40" />
                ) : isConnected && isLive ? (
                  <div className="h-6 w-6 animate-pulse rounded-full bg-live-indicator" />
                ) : (
                  <Video className="h-8 w-8 text-white" />
                )}
              </div>
              <p className="text-lg font-medium">
                {configError
                  ? 'Configuration Error'
                  : !configLoaded
                    ? 'Loading...'
                    : !isConnected
                      ? 'Connecting...'
                      : isHost && !isVideoEnabled
                        ? 'Camera Off'
                        : isLive
                          ? 'Live Stream'
                          : 'Stream Offline'}
              </p>
              <p className="mt-1 text-sm text-gray-300">
                {configError
                  ? 'Failed to load stream configuration'
                  : !configLoaded
                    ? 'Please wait while we load your stream...'
                    : !isConnected
                      ? 'Please wait...'
                      : isLive
                        ? `${viewerCount.toLocaleString()} watching now`
                        : 'Stream has ended'}
              </p>
            </div>
          </div>
        )}

        {/* Live indicator */}
        {isLive && (
          <Badge className="absolute left-4 top-4 border-0 bg-live-indicator text-white">
            <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-white" />
            LIVE
          </Badge>
        )}

        {/* Stream controls overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" onClick={handlePlayPause} className="text-white hover:bg-white/20">
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleMute} className="text-white hover:bg-white/20">
                  {isMuted || (isHost && !isAudioEnabled) ? (
                    <VolumeX className="h-6 w-6" />
                  ) : (
                    <Volume2 className="h-6 w-6" />
                  )}
                </Button>
                {isHost && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleVideoToggle}
                    className="text-white hover:bg-white/20"
                  >
                    {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                  </Button>
                )}
                <div className="text-sm text-white">{viewerCount.toLocaleString()} viewers</div>
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stream info */}
      <div className="bg-card p-4"></div>
    </Card>
  );
};
export default StreamPlayer;
