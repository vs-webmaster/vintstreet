// Listing Service
// Centralized data access for listing operations

import { supabase } from '@/integrations/supabase/client';
import type { Result } from '@/types/api';
import { success, failure } from '@/types/api';
import { normalizeError, logError } from '@/lib/errors';

export interface Listing {
  id: string;
  product_name: string;
  product_description?: string;
  starting_price: number;
  discounted_price?: number;
  status: string;
  stock_quantity?: number;
  sku?: string;
  created_at: string;
  updated_at: string;
  subcategory_id?: string;
  sub_subcategory_id?: string;
  archived: boolean;
  product_categories?: { name: string };
  product_subcategories?: { name: string };
  product_sub_subcategories?: { name: string };
  product_sub_sub_subcategories?: { name: string };
  brands?: { name: string };
}

export interface AuctionListing extends Listing {
  slug?: string;
  thumbnail?: string;
  seller_id: string;
  auction_type: string;
  created_at: string;
  auctions: {
    id: string;
    current_bid: number | null;
    starting_bid: number | null;
    end_time: string;
    status: string;
    bid_count: number | null;
    reserve_price: number;
    reserve_met: boolean | null;
  }[];
}

// Fetch archived products
export async function fetchArchivedProducts(): Promise<Result<Listing[]>> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(
        `
        id,
        product_name,
        product_description,
        starting_price,
        discounted_price,
        status,
        stock_quantity,
        sku,
        created_at,
        updated_at,
        subcategory_id,
        sub_subcategory_id,
        product_categories(name),
        product_subcategories(name),
        product_sub_subcategories(name),
        product_sub_sub_subcategories(name),
        brands(name)
      `,
      )
      .eq('archived', true)
      .order('created_at', { ascending: false });

    if (error) {
      logError(error, 'fetchArchivedProducts');
      return failure(normalizeError(error));
    }

    return success((data || []) as Listing[]);
  } catch (error) {
    logError(error, 'fetchArchivedProducts');
    return failure(normalizeError(error));
  }
}

// Fetch auction products with pagination
export async function fetchAuctionProducts(params: {
  page: number;
  pageSize: number;
  sortBy?: string;
}): Promise<Result<{ products: AuctionListing[]; totalCount: number }>> {
  try {
    let query = supabase
      .from('listings')
      .select(
        `
        id,
        slug,
        product_name,
        starting_price,
        thumbnail,
        product_description,
        seller_id,
        status,
        created_at,
        auction_type,
        auctions!inner(
          id,
          current_bid,
          starting_bid,
          end_time,
          status,
          bid_count,
          reserve_price,
          reserve_met
        )
      `,
        { count: 'exact' },
      )
      .eq('auction_type', 'timed')
      .eq('status', 'published')
      .eq('product_type', 'shop')
      .eq('archived', false)
      .eq('auctions.status', 'active');

    // Apply sorting
    if (params.sortBy === 'ending_soon') {
      query = query.order('end_time', { foreignTable: 'auctions', ascending: true });
    } else if (params.sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (params.sortBy === 'price_low') {
      query = query.order('starting_price', { ascending: true });
    } else if (params.sortBy === 'price_high') {
      query = query.order('starting_price', { ascending: false });
    }

    const {
      data: products,
      error,
      count,
    } = await query.range(params.page * params.pageSize, (params.page + 1) * params.pageSize - 1);

    if (error) {
      logError(error, 'fetchAuctionProducts');
      return failure(normalizeError(error));
    }

    return success({
      products: (products || []) as AuctionListing[],
      totalCount: count || 0,
    });
  } catch (error) {
    logError(error, 'fetchAuctionProducts');
    return failure(normalizeError(error));
  }
}

// Fetch product attribute values in batches
export async function fetchProductAttributeValues(productIds: string[]): Promise<Result<any[]>> {
  try {
    const batchSize = 500;
    const allAttributeValues: unknown[] = [];

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batchIds = productIds.slice(i, i + batchSize);
      const { data: batchValues, error } = await supabase
        .from('product_attribute_values')
        .select(
          `
          product_id,
          attribute_id,
          value_text,
          value_number,
          value_boolean,
          value_date,
          attributes(id, name, data_type)
        `,
        )
        .in('product_id', batchIds);

      if (error) {
        logError(error, 'fetchProductAttributeValues');
        return failure(normalizeError(error));
      }

      if (batchValues) {
        allAttributeValues.push(...batchValues);
      }
    }

    return success(allAttributeValues);
  } catch (error) {
    logError(error, 'fetchProductAttributeValues');
    return failure(normalizeError(error));
  }
}
