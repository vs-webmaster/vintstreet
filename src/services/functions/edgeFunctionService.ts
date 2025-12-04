// Edge Functions Service
// Wrapper for Supabase Edge Function invocations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface InvokeFunctionOptions {
  functionName: string;
  body?: unknown;
  headers?: Record<string, string>;
}

// Invoke a Supabase Edge Function
export async function invokeEdgeFunction<T = any>(options: InvokeFunctionOptions): Promise<Result<T>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.functions.invoke(options.functionName, {
      body: options.body,
      headers: options.headers,
    });

    if (error) throw error;
    return { data: data as T, error: null };
  }, `invokeEdgeFunction:${options.functionName}`);
}
