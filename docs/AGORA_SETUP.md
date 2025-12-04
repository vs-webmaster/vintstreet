# Agora.io Live Video Setup Guide

This guide will help you configure Agora.io for live video streaming in your application.

## Step 1: Create an Agora Account

1. Go to [Agora Console](https://console.agora.io/)
2. Sign up for a free account
3. Create a new project

## Step 2: Get Your App ID

1. In the Agora Console, navigate to your project
2. Copy your **App ID** from the project dashboard
3. Open `src/config/agora.ts` in your project
4. Replace `"your_agora_app_id_here"` with your actual App ID

```typescript
export const AGORA_CONFIG = {
  appId: "your_actual_app_id_here", // Paste your App ID here
  token: null,
  codec: 'vp8' as const,
  mode: 'live' as const,
};
```

## Step 3: Test the Integration

1. Go to the Seller Dashboard (`/seller`)
2. Create a new stream or use an existing one
3. Click "Start Stream" to begin broadcasting
4. Open the stream page (`/stream/:id`) in another browser/tab to view as audience

## Features Available

- **Host Controls**: Camera on/off, microphone on/off, stream start/stop
- **Viewer Experience**: Watch live video streams, see viewer count
- **Real-time Communication**: Audio and video streaming via Agora's CDN
- **Responsive Design**: Works on desktop and mobile devices

## Production Setup (Recommended)

For production environments, implement token-based authentication:

1. Set up a token server following [Agora's Token Server Guide](https://docs.agora.io/en/Interactive%20Broadcast/token_server?platform=All%20Platforms)
2. Update the `token` field in `AGORA_CONFIG` to fetch tokens from your server
3. Enable authentication in your Agora Console project settings

## Troubleshooting

### Common Issues:

1. **"Connection Failed"**: Check if your App ID is correct
2. **No Video/Audio**: Ensure browser permissions for camera/microphone
3. **HTTPS Required**: Agora requires HTTPS for production (ensure your deployment uses HTTPS)

### Browser Permissions:

- Chrome: Click the camera icon in the address bar
- Firefox: Go to Settings > Privacy & Security > Permissions
- Safari: Safari > Settings > Websites > Camera/Microphone

## Support

- [Agora Documentation](https://docs.agora.io/)
- [Agora Community](https://www.agora.io/en/community/)
- [Agora Console](https://console.agora.io/)

## Free Tier Limits

Agora provides 10,000 free minutes per month, which is great for development and small-scale deployments.