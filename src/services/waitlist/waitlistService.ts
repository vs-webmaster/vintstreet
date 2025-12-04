// Waitlist Service
// Centralized data access for waitlist operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface WaitlistSignup {
  id: string;
  email: string;
  created_at: string;
}

export interface CreateWaitlistSignupInput {
  email: string;
}

// Create a waitlist signup
export async function createWaitlistSignup(input: CreateWaitlistSignupInput): Promise<Result<WaitlistSignup>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('waitlist_signups')
      .insert([{ email: input.email.trim() }])
      .select()
      .single();

    if (error) throw error;
    return { data: data as WaitlistSignup, error: null };
  }, 'createWaitlistSignup');
}

// Fetch all waitlist signups (for admin)
export async function fetchAllWaitlistSignups(): Promise<Result<WaitlistSignup[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('waitlist_signups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as WaitlistSignup[], error: null };
  }, 'fetchAllWaitlistSignups');
}
