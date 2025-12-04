// Support Service
// Centralized data access for support page operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface SupportPageSettings {
  id: string;
  page_title: string | null;
  page_description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string | null;
}

export interface SupportFAQ {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SupportContactCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  email?: string | null;
  phone?: string | null;
  link?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Fetch support page settings
export async function fetchSupportPageSettings(): Promise<Result<SupportPageSettings | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('support_page_settings').select('*').maybeSingle();

    if (error) throw error;
    return { data: (data as SupportPageSettings) || null, error: null };
  }, 'fetchSupportPageSettings');
}

// Fetch active FAQs
export async function fetchActiveFAQs(): Promise<Result<SupportFAQ[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('support_faqs')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return { data: (data || []) as SupportFAQ[], error: null };
  }, 'fetchActiveFAQs');
}

// Fetch active contact cards
export async function fetchActiveContactCards(): Promise<Result<SupportContactCard[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('support_contact_cards')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return { data: (data || []) as SupportContactCard[], error: null };
  }, 'fetchActiveContactCards');
}

// Admin functions - fetch all (including inactive)
export async function fetchAllSupportSettings(): Promise<Result<SupportPageSettings | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('support_page_settings').select('*').maybeSingle();

    if (error) throw error;
    return { data: (data as SupportPageSettings) || null, error: null };
  }, 'fetchAllSupportSettings');
}

export async function fetchAllFAQs(): Promise<Result<SupportFAQ[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('support_faqs').select('*').order('display_order');

    if (error) throw error;
    return { data: (data || []) as SupportFAQ[], error: null };
  }, 'fetchAllFAQs');
}

export async function fetchAllContactCards(): Promise<Result<SupportContactCard[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('support_contact_cards').select('*').order('display_order');

    if (error) throw error;
    return { data: (data || []) as SupportContactCard[], error: null };
  }, 'fetchAllContactCards');
}

// Update support settings
export async function updateSupportSettings(
  settingsId: string,
  values: Partial<SupportPageSettings>,
): Promise<Result<SupportPageSettings>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('support_page_settings')
      .update(values)
      .eq('id', settingsId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as SupportPageSettings, error: null };
  }, 'updateSupportSettings');
}

// Create FAQ
export async function createFAQ(values: Partial<SupportFAQ>): Promise<Result<SupportFAQ>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('support_faqs')
      .insert({
        answer: values.answer || '',
        question: values.question,
        display_order: values.display_order || 0,
        is_active: values.is_active || true,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as SupportFAQ, error: null };
  }, 'createFAQ');
}

// Update FAQ
export async function updateFAQ(faqId: string, values: Partial<SupportFAQ>): Promise<Result<SupportFAQ>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('support_faqs').update(values).eq('id', faqId).select().single();

    if (error) throw error;
    return { data: data as SupportFAQ, error: null };
  }, 'updateFAQ');
}

// Delete FAQ
export async function deleteFAQ(faqId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('support_faqs').delete().eq('id', faqId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteFAQ');
}

// Create contact card
export async function createContactCard(values: Partial<SupportContactCard>): Promise<Result<SupportContactCard>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('support_contact_cards')
      .insert({
        title: values.title,
        description: values.description || '',
        icon: values.icon,
        email: values.email || null,
        phone: values.phone || null,
        link: values.link || null,
        is_active: values.is_active || true,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as SupportContactCard, error: null };
  }, 'createContactCard');
}

// Update contact card
export async function updateContactCard(
  cardId: string,
  values: Partial<SupportContactCard>,
): Promise<Result<SupportContactCard>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('support_contact_cards')
      .update(values)
      .eq('id', cardId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as SupportContactCard, error: null };
  }, 'updateContactCard');
}

// Delete contact card
export async function deleteContactCard(cardId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('support_contact_cards').delete().eq('id', cardId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteContactCard');
}
