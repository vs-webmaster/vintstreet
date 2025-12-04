// Streams Service
// Centralized data access for stream operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';
import type { Stream } from '@/types';

export interface CreateStreamInput {
  seller_id: string;
  title: string;
  description?: string | null;
  category: string;
  start_time: string;
  thumbnail?: string | null;
  status?: string;
  duration?: string;
  timezone?: string;
}

export interface UpdateStreamInput {
  title?: string;
  description?: string | null;
  category?: string;
  start_time?: string;
  thumbnail?: string | null;
  status?: string;
  end_time?: string;
}

// Fetch streams by user ID
export async function fetchStreamsByUserId(userId: string): Promise<Result<Stream[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .eq('seller_id', userId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Stream[], error: null };
  }, 'fetchStreamsByUserId');
}

// Fetch a single stream by ID (public - no userId constraint)
export async function fetchStreamByIdPublic(streamId: string): Promise<Result<Stream | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('streams').select('*').eq('id', streamId).maybeSingle();

    if (error) throw error;
    return { data: (data as Stream) || null, error: null };
  }, 'fetchStreamByIdPublic');
}

// Fetch a single stream by ID (for seller - requires userId)
export async function fetchStreamById(streamId: string, userId: string): Promise<Result<Stream | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .eq('id', streamId)
      .eq('seller_id', userId)
      .maybeSingle();

    if (error) throw error;
    return { data: (data as Stream) || null, error: null };
  }, 'fetchStreamById');
}

// Create a new stream
export async function createStream(input: CreateStreamInput): Promise<Result<Stream>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('streams')
      .insert({
        seller_id: input.seller_id,
        title: input.title,
        description: input.description,
        category: input.category,
        start_time: input.start_time,
        thumbnail: input.thumbnail,
        status: input.status || 'scheduled',
        duration: input.duration,
        timezone: input.timezone,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as Stream, error: null };
  }, 'createStream');
}

// Create multiple streams at once
export async function createStreams(inputs: CreateStreamInput[]): Promise<Result<Stream[]>> {
  return withMutation(async () => {
    const streamsToInsert = inputs.map((input) => ({
      seller_id: input.seller_id,
      title: input.title,
      description: input.description,
      category: input.category,
      start_time: input.start_time,
      thumbnail: input.thumbnail,
      status: input.status || 'scheduled',
      duration: input.duration,
      timezone: input.timezone,
    }));

    const { data, error } = await supabase.from('streams').insert(streamsToInsert).select();

    if (error) throw error;
    return { data: (data || []) as Stream[], error: null };
  }, 'createStreams');
}

// Update stream status
export async function updateStreamStatus(streamId: string, status: string, endTime?: string): Promise<Result<Stream>> {
  return withMutation(async () => {
    const updateData: unknown = { status };
    if (endTime) updateData.end_time = endTime;

    const { data, error } = await supabase.from('streams').update(updateData).eq('id', streamId).select().single();

    if (error) throw error;
    return { data: data as Stream, error: null };
  }, 'updateStreamStatus');
}

// Update stream (general update)
export async function updateStream(
  streamId: string,
  userId: string,
  updates: UpdateStreamInput,
): Promise<Result<Stream>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('streams')
      .update(updates)
      .eq('id', streamId)
      .eq('seller_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Stream, error: null };
  }, 'updateStream');
}

// Stream Categories

export interface StreamCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

// Fetch active stream categories
export async function fetchActiveStreamCategories(): Promise<Result<string[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('stream_categories').select('name').eq('is_active', true).order('name');

    if (error) throw error;
    return { data: (data || []).map((cat) => cat.name), error: null };
  }, 'fetchActiveStreamCategories');
}

// Fetch all stream categories
export async function fetchAllStreamCategories(): Promise<Result<StreamCategory[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('stream_categories').select('*').order('name');

    if (error) throw error;
    return { data: (data || []) as StreamCategory[], error: null };
  }, 'fetchAllStreamCategories');
}

// Stream with seller and user profile info
export interface StreamWithProfiles {
  id: string;
  title: string;
  seller_id: string;
  thumbnail: string | null;
  viewer_count: number | null;
  status: string;
  start_time: string;
  category: string;
  seller_profiles?: {
    user_id: string;
    shop_name: string | null;
    business_name: string | null;
    shop_logo_url: string | null;
    display_name_format: string | null;
  } | null;
}

// Fetch streams with seller and user profiles (for listing pages)
export async function fetchStreamsWithProfiles(
  page: number = 0,
  pageSize: number = 9,
): Promise<Result<StreamWithProfiles[]>> {
  return withErrorHandling(async () => {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('streams')
      .select('*, seller_profiles(user_id, shop_name, business_name, shop_logo_url, display_name_format)')
      .order('start_time', { ascending: true })
      .range(from, to);

    if (error) throw error;
    return { data: (data || []) as StreamWithProfiles[], error: null };
  }, 'fetchStreamsWithProfiles');
}

// Fetch livestream products for a seller
export interface LivestreamProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  itemCount: number;
}

export async function fetchLivestreamProducts(sellerId: string): Promise<Result<LivestreamProduct[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('id, product_name, product_description, starting_price')
      .eq('seller_id', sellerId)
      .not('stream_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const products: LivestreamProduct[] = (data || []).map((listing) => ({
      id: listing.id,
      name: listing.product_name,
      description: listing.product_description || '',
      price: `${listing.starting_price}`,
      itemCount: 1,
    }));

    return { data: products, error: null };
  }, 'fetchLivestreamProducts');
}

// Scheduled Show Products
export interface ScheduledShowProduct {
  show_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

export async function createScheduledShowProducts(
  products: ScheduledShowProduct[],
): Promise<Result<ScheduledShowProduct[]>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('scheduled_show_products').insert(products).select();

    if (error) throw error;
    return { data: (data || []) as ScheduledShowProduct[], error: null };
  }, 'createScheduledShowProducts');
}
