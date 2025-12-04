import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key to access secrets
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Get Agora credentials from environment (Supabase secrets)
    let agoraAppId = Deno.env.get('AGORA_APP_ID');
    let appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE');

    // Sanitize and validate App ID
    if (!agoraAppId) {
      console.error('AGORA_APP_ID not found in environment');
      return new Response(JSON.stringify({ error: 'Agora App ID not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trim whitespace and remove quotes if present
    agoraAppId = agoraAppId.trim().replace(/^["']|["']$/g, '');

    // Validate App ID format (should be 32 hex characters)
    if (!/^[a-f0-9]{32}$/i.test(agoraAppId)) {
      console.error('Invalid AGORA_APP_ID format:', agoraAppId.length, 'chars, expected 32 hex chars');
      return new Response(JSON.stringify({ error: 'Invalid Agora App ID format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize App Certificate if present
    if (appCertificate) {
      appCertificate = appCertificate.trim().replace(/^["']|["']$/g, '');

      // Validate App Certificate format (should be 32 hex characters)
      if (!/^[a-f0-9]{32}$/i.test(appCertificate)) {
        console.error('Invalid AGORA_APP_CERTIFICATE format');
        appCertificate = undefined; // Fall back to no certificate mode
      }
    }

    // Parse request body for channel and uid
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      // Ignore JSON parse error
    }

    const channelName: string | undefined = body?.channelName;
    const uid: number = body.uid;
    const roleParam: string = (body?.role || 'host').toLowerCase();
    const role = 2; // Always use 2 (host) for streaming

    if (!channelName) {
      return new Response(JSON.stringify({ error: 'channelName is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let finalToken: string | null = null;

    if (appCertificate && channelName) {
      try {
        const expireTimeInSeconds = 3600; // 1 hour

        const requestPayload = {
          channelName: channelName,
          uid: uid.toString(),
          tokenExpireTs: expireTimeInSeconds,
          privilegeExpireTs: expireTimeInSeconds,
          serviceRtc: {
            enable: true,
            role: 1, // 1 for host/publisher
          },
        };

        // Call external Agora token service
        const tokenResponse = await fetch(
          'https://agora-token-service-1084401665807.europe-west1.run.app/token/generate',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload),
          },
        );

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('❌ Token service error response:', errorText);
          throw new Error(`Token service responded with status: ${tokenResponse.status} - ${errorText}`);
        }

        const tokenData = await tokenResponse.json();

        // Extract token from nested response structure
        const token = tokenData.data?.token || tokenData.token;

        if (!token) {
          console.error('❌ No token found in response:', tokenData);
          throw new Error('Token service did not return a token');
        }

        finalToken = token;
      } catch (e) {
        console.error('Failed to generate Agora RTC token:', e);
        return new Response(JSON.stringify({ error: 'Failed to generate Agora token' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      if (!appCertificate) {
        console.error('AGORA_APP_CERTIFICATE is not set; returning null token (dev mode).');
      }
    }

    return new Response(
      JSON.stringify({
        appId: agoraAppId,
        token: finalToken,
        codec: 'vp8',
        mode: 'live',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error: unknown) {
    console.error('Error in get-agora-config function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
