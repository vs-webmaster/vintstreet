// Promo Message Service
// Centralized data access for promo message operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface PromoMessage {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch promo message
export async function fetchPromoMessage(): Promise<Result<PromoMessage | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('promo_message').select('*').maybeSingle();

    if (error) throw error;
    return { data: (data as PromoMessage) || null, error: null };
  }, 'fetchPromoMessage');
}

// Update promo message
export async function updatePromoMessage(message: string, isActive: boolean): Promise<Result<PromoMessage>> {
  return withMutation(async () => {
    // First, get existing record ID
    const { data: existing } = await supabase.from('promo_message').select('id').maybeSingle();

    if (existing?.id) {
      // Update existing
      const { data, error } = await supabase
        .from('promo_message')
        .update({
          message,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as PromoMessage, error: null };
    } else {
      // Create new
      const { data, error } = await supabase
        .from('promo_message')
        .insert({
          message,
          is_active: isActive,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as PromoMessage, error: null };
    }
  }, 'updatePromoMessage');
}
