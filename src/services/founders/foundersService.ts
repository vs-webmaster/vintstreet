// Founders Service
// Centralized data access for founders list operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface Founder {
  id: string;
  name: string;
  email: string;
  intent: string | null;
  interests: string[] | null;
  price_range: string | null;
  selling_plans: string | null;
  created_at: string;
}

// Fetch all founders
export async function fetchAllFounders(): Promise<Result<Founder[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('founders_list').select('*').order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Founder[], error: null };
  }, 'fetchAllFounders');
}

export interface CreateFounderEntryInput {
  name: string;
  email: string;
}

export interface UpdateFounderEntryInput {
  intent?: string;
  interests?: string[];
  price_range?: string;
  selling_plans?: string;
}

// Create a new founder entry
export async function createFounderEntry(input: CreateFounderEntryInput): Promise<Result<Founder>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('founders_list')
      .insert({
        name: input.name,
        email: input.email,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as Founder, error: null };
  }, 'createFounderEntry');
}

// Update a founder entry by email
export async function updateFounderEntry(email: string, input: UpdateFounderEntryInput): Promise<Result<Founder>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('founders_list')
      .update(input)
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Founder, error: null };
  }, 'updateFounderEntry');
}
