// Footer Service
// Centralized data access for footer operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface FooterColumn {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FooterLink {
  id: string;
  column_id: string;
  label: string;
  url: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Fetch all footer columns
export async function fetchFooterColumns(): Promise<Result<FooterColumn[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('footer_columns').select('*').order('display_order');

    if (error) throw error;
    return { data: (data || []) as FooterColumn[], error: null };
  }, 'fetchFooterColumns');
}

// Fetch all footer links
export async function fetchFooterLinks(): Promise<Result<FooterLink[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('footer_links').select('*').order('display_order');

    if (error) throw error;
    return { data: (data || []) as FooterLink[], error: null };
  }, 'fetchFooterLinks');
}

// Create footer column
export interface CreateFooterColumnInput {
  title: string;
  display_order?: number;
  is_active?: boolean;
}

export async function createFooterColumn(input: CreateFooterColumnInput): Promise<Result<FooterColumn>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('footer_columns').insert(input).select().single();

    if (error) throw error;
    return { data: data as FooterColumn, error: null };
  }, 'createFooterColumn');
}

// Delete footer column
export async function deleteFooterColumn(columnId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('footer_columns').delete().eq('id', columnId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteFooterColumn');
}

// Create footer link
export interface CreateFooterLinkInput {
  column_id: string;
  label: string;
  url: string;
  display_order?: number;
  is_active?: boolean;
}

export async function createFooterLink(input: CreateFooterLinkInput): Promise<Result<FooterLink>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('footer_links').insert(input).select().single();

    if (error) throw error;
    return { data: data as FooterLink, error: null };
  }, 'createFooterLink');
}

// Delete footer link
export async function deleteFooterLink(linkId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('footer_links').delete().eq('id', linkId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteFooterLink');
}
