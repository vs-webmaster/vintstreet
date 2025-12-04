import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function authenticateUser(req: Request, supabaseClient: SupabaseClient): Promise<User> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    throw new Error('Unauthorized: Missing or malformed authorization header');
  }

  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data?.user) {
    throw new Error('Unauthorized: Invalid token');
  }

  return data.user;
}

export function createErrorResponse(error: unknown, headers: Record<string, string>, status = 500) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const statusCode = errorMessage.startsWith('Unauthorized') ? 401 : status;

  return new Response(JSON.stringify({ error: errorMessage }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
    status: statusCode,
  });
}
