// Prohibited Words Service
// Centralized data access for prohibited words operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface ProhibitedWord {
  id: string;
  word: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all active prohibited words
export async function fetchActiveProhibitedWords(): Promise<Result<string[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('prohibited_words').select('word').eq('is_active', true);

    if (error) throw error;
    return { data: (data || []).map((item) => item.word.toLowerCase()), error: null };
  }, 'fetchActiveProhibitedWords');
}

// Fetch all prohibited words (for admin)
export async function fetchAllProhibitedWords(): Promise<Result<ProhibitedWord[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('prohibited_words').select('*').order('word', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as ProhibitedWord[], error: null };
  }, 'fetchAllProhibitedWords');
}

// Create prohibited word
export async function createProhibitedWord(word: string): Promise<Result<ProhibitedWord>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('prohibited_words')
      .insert({ word: word.trim().toLowerCase() })
      .select()
      .single();

    if (error) throw error;
    return { data: data as ProhibitedWord, error: null };
  }, 'createProhibitedWord');
}

// Update prohibited word (toggle active status)
export async function updateProhibitedWord(wordId: string, isActive: boolean): Promise<Result<ProhibitedWord>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('prohibited_words')
      .update({ is_active: isActive })
      .eq('id', wordId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as ProhibitedWord, error: null };
  }, 'updateProhibitedWord');
}

// Delete prohibited word
export async function deleteProhibitedWord(wordId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('prohibited_words').delete().eq('id', wordId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteProhibitedWord');
}

// Bulk create prohibited words
export async function bulkCreateProhibitedWords(words: string[]): Promise<Result<ProhibitedWord[]>> {
  return withMutation(async () => {
    const wordsToInsert = words.map((word) => ({ word: word.trim().toLowerCase() }));
    const { data, error } = await supabase.from('prohibited_words').insert(wordsToInsert).select();

    if (error) throw error;
    return { data: (data || []) as ProhibitedWord[], error: null };
  }, 'bulkCreateProhibitedWords');
}
