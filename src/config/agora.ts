// Agora.io Configuration
import { invokeEdgeFunction } from '@/services/functions';
import { isFailure } from '@/types/api';

// Cached configs to avoid multiple API calls
let cachedConfig: any = null;
let cachedRTMConfig: any = null;

export const getAgoraConfig = async (params?: { channelName?: string; uid?: number; role?: 'host' | 'audience' }) => {
  if (cachedConfig && !params) {
    return cachedConfig;
  }

  try {
    const result = await invokeEdgeFunction({
      functionName: 'get-agora-config',
      body: params || {},
    });

    if (isFailure(result)) {
      console.error('Error fetching Agora config:', result.error);
      throw new Error('Failed to fetch Agora configuration');
    }

    // Do not cache if params are provided (token is per-channel/uid)
    if (!params) cachedConfig = result.data;
    return result.data;
  } catch (error) {
    console.error('Error in getAgoraConfig:', error);
    throw error;
  }
};

export const getAgoraRTMConfig = async (params?: { channelName?: string; uid?: string }) => {
  if (cachedRTMConfig && !params) {
    return cachedRTMConfig;
  }

  try {
    const result = await invokeEdgeFunction({
      functionName: 'get-agora-rtm-config',
      body: params || {},
    });

    if (isFailure(result)) {
      console.error('Error fetching Agora RTM config:', result.error);
      throw new Error('Failed to fetch Agora RTM config');
    }

    // Do not cache if params are provided (token is per-channel/uid)
    if (!params) cachedRTMConfig = result.data;
    return result.data;
  } catch (error) {
    console.error('Error in getAgoraRTMConfig:', error);
    throw error;
  }
};

// Clear cache when needed (e.g., on logout)
export const clearAgoraConfigCache = () => {
  cachedConfig = null;
};

export const clearAgoraRTMConfigCache = () => {
  cachedRTMConfig = null;
};

// Default fallback config for development (will be replaced by secure config)
export const AGORA_CONFIG = {
  appId: '578fc4cf2194471794d0198d1f6a595b',
  token: null,
  codec: 'vp8' as const,
  mode: 'live' as const,
};

// Instructions for setup:
// 1. Go to https://console.agora.io/
// 2. Create a new project
// 3. Copy your App ID and replace "your_agora_app_id_here" above
// 4. For production, set up token authentication (recommended)
// 5. Update the appId in this file

export default AGORA_CONFIG;
