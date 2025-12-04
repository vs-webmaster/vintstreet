import { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  ILocalVideoTrack,
  ILocalAudioTrack,
} from 'agora-rtc-sdk-ng';
import { getAgoraConfig, clearAgoraConfigCache } from '@/config/agora';

interface UseAgoraProps {
  channelName: string;
  userId?: string;
  isHost?: boolean;
}

interface AgoraState {
  isConnected: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  remoteUsers: number[];
  localVideoTrack: ILocalVideoTrack | null;
  localAudioTrack: ILocalAudioTrack | null;
  configLoaded: boolean;
  configError: string | null;
}

export const useAgora = ({ channelName, userId, isHost = false }: UseAgoraProps) => {
  const [state, setState] = useState<AgoraState>({
    isConnected: false,
    isVideoEnabled: false,
    isAudioEnabled: false,
    remoteUsers: [],
    localVideoTrack: null,
    localAudioTrack: null,
    configLoaded: false,
    configError: null,
  });

  const [agoraConfig, setAgoraConfig] = useState<unknown>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const remoteVideoTracksRef = useRef<Map<number, IRemoteVideoTrack>>(new Map());
  const remoteAudioTracksRef = useRef<Map<number, IRemoteAudioTrack>>(new Map());
  const uidRef = useRef<number | null>(null);
  const initializingRef = useRef(false);
  // Load Agora configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        if (uidRef.current == null) {
          uidRef.current = userId ? parseInt(userId) : Math.floor(Math.random() * 10000);
        }
        const config = await getAgoraConfig({
          channelName,
          uid: uidRef.current!,
          role: isHost ? 'host' : 'audience',
        });

        // Validate App ID format on frontend
        if (!config.appId || !/^[a-f0-9]{32}$/i.test(config.appId)) {
          throw new Error(`Invalid App ID format: ${config.appId}. Expected 32 hexadecimal characters.`);
        }

        setAgoraConfig(config);
        setState((prev) => ({ ...prev, configLoaded: true, configError: null }));
      } catch (error) {
        console.error('Failed to load Agora config:', error);
        setState((prev) => ({
          ...prev,
          configLoaded: false,
          configError: error instanceof Error ? error.message : 'Failed to load configuration',
        }));
      }
    };

    loadConfig();

    // Clear config cache on unmount
    return () => {
      clearAgoraConfigCache();
    };
  }, []);

  useEffect(() => {
    if (!channelName || !agoraConfig || !state.configLoaded) {
      return;
    }

    if (clientRef.current || initializingRef.current) {
      return;
    }

    const initializeAgora = async () => {
      try {
        initializingRef.current = true;
        // Create Agora client exactly as per documentation
        const client = AgoraRTC.createClient({
          mode: 'live',
          codec: 'vp8',
        });
        clientRef.current = client;

        // Set client role after creation (as per documentation)
        client.setClientRole(isHost ? 'host' : 'audience');

        // Handle connection state changes
        client.on('connection-state-change', (curState, revState, reason) => {
          if (curState === 'CONNECTED') {
            setState((prev) => ({ ...prev, isConnected: true, configError: null }));
          } else if (curState === 'DISCONNECTED') {
            setState((prev) => ({ ...prev, isConnected: false }));
          }
        });

        // Handle remote user events
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          if (mediaType === 'video') {
            const remoteVideoTrack = user.videoTrack;
            if (remoteVideoTrack) {
              remoteVideoTracksRef.current.set(user.uid as number, remoteVideoTrack);
            }
          }

          if (mediaType === 'audio') {
            const remoteAudioTrack = user.audioTrack;
            if (remoteAudioTrack) {
              remoteAudioTracksRef.current.set(user.uid as number, remoteAudioTrack);
              remoteAudioTrack.play();
            }
          }

          setState((prev) => ({
            ...prev,
            remoteUsers: Array.from(new Set([...prev.remoteUsers, user.uid as number])),
          }));
        });

        client.on('user-unpublished', (user) => {
          remoteVideoTracksRef.current.delete(user.uid as number);
          remoteAudioTracksRef.current.delete(user.uid as number);

          setState((prev) => ({
            ...prev,
            remoteUsers: prev.remoteUsers.filter((uid) => uid !== user.uid),
          }));
        });

        client.on('user-left', (user) => {
          remoteVideoTracksRef.current.delete(user.uid as number);
          remoteAudioTracksRef.current.delete(user.uid as number);

          setState((prev) => ({
            ...prev,
            remoteUsers: prev.remoteUsers.filter((uid) => uid !== user.uid),
          }));
        });

        // Join channel
        const uid = uidRef.current ?? (userId ? parseInt(userId) : Math.floor(Math.random() * 10000));
        if (uidRef.current == null) uidRef.current = uid;

        try {
          await client.join(agoraConfig.appId, channelName, agoraConfig.token, uid);
          setState((prev) => ({ ...prev, isConnected: true }));
        } catch (joinError) {
          console.error('Failed to join Agora channel:', joinError);
          // If the error is about gateway server, log more details
          if (joinError.code === 'CAN_NOT_GET_GATEWAY_SERVER') {
            console.error('Gateway server error - this usually indicates:');
            console.error('1. Invalid App ID');
            console.error('2. Token configuration mismatch');
            console.error('3. Network connectivity issues');
          }
          throw joinError;
        }
      } catch (error) {
        console.error('Failed to initialize Agora:', error);
        setState((prev) => ({
          ...prev,
          configError: error instanceof Error ? error.message : 'Failed to initialize Agora',
        }));
      } finally {
        initializingRef.current = false;
      }
    };

    initializeAgora();
  }, [channelName, userId, isHost, agoraConfig, state.configLoaded]);

  // Cleanup function for tracks
  const cleanupTracks = () => {
    if (state.localVideoTrack) {
      state.localVideoTrack.close();
    }
    if (state.localAudioTrack) {
      state.localAudioTrack.close();
    }
    remoteVideoTracksRef.current.clear();
    remoteAudioTracksRef.current.clear();
  };

  // Separate cleanup effect
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        cleanupTracks();
        clientRef.current.leave().catch(console.error);
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
      initializingRef.current = false;
    };
  }, []);

  const startVideo = async () => {
    if (!clientRef.current || !isHost) {
      return;
    }

    if (!state.isConnected) {
      throw new Error('Not connected to channel yet. Please wait for connection.');
    }

    try {
      const videoTrack = await AgoraRTC.createCameraVideoTrack();

      await clientRef.current.publish([videoTrack]);

      setState((prev) => ({
        ...prev,
        isVideoEnabled: true,
        localVideoTrack: videoTrack,
      }));
    } catch (error) {
      console.error('Failed to start video:', error);
      throw error;
    }
  };

  const stopVideo = async () => {
    if (!clientRef.current || !state.localVideoTrack) return;

    try {
      await clientRef.current.unpublish([state.localVideoTrack]);
      state.localVideoTrack.close();

      setState((prev) => ({
        ...prev,
        isVideoEnabled: false,
        localVideoTrack: null,
      }));
    } catch (error) {
      console.error('Failed to stop video:', error);
    }
  };

  const startAudio = async () => {
    if (!clientRef.current || !isHost) {
      return;
    }

    if (!state.isConnected) {
      throw new Error('Not connected to channel yet. Please wait for connection.');
    }

    try {
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

      await clientRef.current.publish([audioTrack]);

      setState((prev) => ({
        ...prev,
        isAudioEnabled: true,
        localAudioTrack: audioTrack,
      }));
    } catch (error) {
      console.error('Failed to start audio:', error);
      throw error;
    }
  };

  const stopAudio = async () => {
    if (!clientRef.current || !state.localAudioTrack) return;

    try {
      await clientRef.current.unpublish([state.localAudioTrack]);
      state.localAudioTrack.close();

      setState((prev) => ({
        ...prev,
        isAudioEnabled: false,
        localAudioTrack: null,
      }));
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  };

  const getRemoteVideoTrack = (uid: number): IRemoteVideoTrack | undefined => {
    return remoteVideoTracksRef.current.get(uid);
  };

  const playRemoteVideo = (uid: number, container: HTMLElement) => {
    const track = remoteVideoTracksRef.current.get(uid);
    if (track) {
      track.play(container);
    }
  };

  const playLocalVideo = (container: HTMLElement) => {
    if (state.localVideoTrack) {
      state.localVideoTrack.play(container);
    }
  };

  return {
    ...state,
    startVideo,
    stopVideo,
    startAudio,
    stopAudio,
    getRemoteVideoTrack,
    playRemoteVideo,
    playLocalVideo,
  };
};
