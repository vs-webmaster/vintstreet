// Homepage Service
// Centralized data access for homepage content operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

// Homepage Card interfaces
export interface HomepageCard {
  id: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomepageCardItem {
  id: string;
  homepage_card_id: string;
  image_url: string | null;
  link: string | null;
  overlay_text: string | null;
  button_text: string | null;
  button_link: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch active homepage card with items
export async function fetchHomepageCardWithItems(): Promise<
  Result<{ card: HomepageCard; items: HomepageCardItem[] } | null>
> {
  return withErrorHandling(async () => {
    const { data: cards, error: cardsError } = await supabase
      .from('homepage_cards')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (cardsError) throw cardsError;
    if (!cards) return { data: null, error: null };

    const { data: items, error: itemsError } = await supabase
      .from('homepage_card_items')
      .select('*')
      .eq('homepage_card_id', cards.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (itemsError) throw itemsError;

    return {
      data: {
        card: cards as HomepageCard,
        items: (items || []) as HomepageCardItem[],
      },
      error: null,
    };
  }, 'fetchHomepageCardWithItems');
}

// Fetch homepage card with items (admin - includes inactive)
export async function fetchHomepageCardWithItemsAdmin(): Promise<
  Result<{ card: HomepageCard | null; items: HomepageCardItem[] }>
> {
  return withErrorHandling(async () => {
    const { data: cards, error: cardsError } = await supabase.from('homepage_cards').select('*').limit(1).maybeSingle();

    if (cardsError) throw cardsError;

    if (!cards) {
      return { data: { card: null, items: [] }, error: null };
    }

    const { data: cardItems, error: itemsError } = await supabase
      .from('homepage_card_items')
      .select('*')
      .eq('homepage_card_id', cards.id)
      .order('display_order', { ascending: true });

    if (itemsError) throw itemsError;

    return {
      data: {
        card: cards as HomepageCard,
        items: (cardItems || []) as HomepageCardItem[],
      },
      error: null,
    };
  }, 'fetchHomepageCardWithItemsAdmin');
}

// Create or update homepage card
export async function upsertHomepageCard(
  cardId: string | null,
  title: string,
  description: string,
): Promise<Result<HomepageCard>> {
  return withMutation(async () => {
    if (!cardId) {
      // Create new card
      const { data, error } = await supabase
        .from('homepage_cards')
        .insert({ title, description, is_active: true })
        .select()
        .single();

      if (error) throw error;
      return { data: data as HomepageCard, error: null };
    } else {
      // Update existing card
      const { data, error } = await supabase
        .from('homepage_cards')
        .update({ title, description })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return { data: data as HomepageCard, error: null };
    }
  }, 'upsertHomepageCard');
}

// Delete homepage card items
export async function deleteHomepageCardItems(cardId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('homepage_card_items').delete().eq('homepage_card_id', cardId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteHomepageCardItems');
}

// Insert homepage card items
export async function insertHomepageCardItems(
  items: Array<Omit<HomepageCardItem, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Result<HomepageCardItem[]>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('homepage_card_items').insert(items).select();

    if (error) throw error;
    return { data: (data || []) as HomepageCardItem[], error: null };
  }, 'insertHomepageCardItems');
}
