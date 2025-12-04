-- Fix the rebuild_category_search_index function to use SECURITY DEFINER
-- This allows it to bypass RLS when rebuilding the search index
CREATE OR REPLACE FUNCTION public.rebuild_category_search_index()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Clear existing index
  DELETE FROM public.category_search_index;
  
  -- Insert Level 1 categories
  INSERT INTO public.category_search_index (
    search_term, category_id, category_level, category_name,
    level1_name, level1_slug, display_label, search_url, is_synonym
  )
  SELECT 
    LOWER(name) as search_term,
    id as category_id,
    1 as category_level,
    name as category_name,
    name as level1_name,
    slug as level1_slug,
    name as display_label,
    '/shop?search=' || name as search_url,
    false as is_synonym
  FROM public.product_categories
  WHERE is_active = true;
  
  -- Insert Level 1 synonyms
  INSERT INTO public.category_search_index (
    search_term, category_id, category_level, category_name,
    level1_name, level1_slug, display_label, search_url, is_synonym
  )
  SELECT 
    LOWER(synonym) as search_term,
    id as category_id,
    1 as category_level,
    name as category_name,
    name as level1_name,
    slug as level1_slug,
    name as display_label,
    '/shop?search=' || name as search_url,
    true as is_synonym
  FROM public.product_categories, unnest(synonyms) as synonym
  WHERE is_active = true AND synonyms IS NOT NULL;
  
  -- Insert Level 2 categories
  INSERT INTO public.category_search_index (
    search_term, category_id, category_level, category_name,
    level1_name, level1_slug, level2_name, level2_slug, display_label, search_url, is_synonym
  )
  SELECT 
    LOWER(l2.name) as search_term,
    l2.id as category_id,
    2 as category_level,
    l2.name as category_name,
    l1.name as level1_name,
    l1.slug as level1_slug,
    l2.name as level2_name,
    l2.slug as level2_slug,
    l1.name || ' ' || l2.name as display_label,
    '/shop?search=' || l1.name || ' ' || l2.name as search_url,
    false as is_synonym
  FROM public.product_subcategories l2
  JOIN public.product_categories l1 ON l2.category_id = l1.id
  WHERE l2.is_active = true AND l1.is_active = true;
  
  -- Insert Level 2 synonyms
  INSERT INTO public.category_search_index (
    search_term, category_id, category_level, category_name,
    level1_name, level1_slug, level2_name, level2_slug, display_label, search_url, is_synonym
  )
  SELECT 
    LOWER(synonym) as search_term,
    l2.id as category_id,
    2 as category_level,
    l2.name as category_name,
    l1.name as level1_name,
    l1.slug as level1_slug,
    l2.name as level2_name,
    l2.slug as level2_slug,
    l1.name || ' ' || l2.name as display_label,
    '/shop?search=' || l1.name || ' ' || l2.name as search_url,
    true as is_synonym
  FROM public.product_subcategories l2
  JOIN public.product_categories l1 ON l2.category_id = l1.id,
  unnest(l2.synonyms) as synonym
  WHERE l2.is_active = true AND l1.is_active = true AND l2.synonyms IS NOT NULL;
  
  -- Insert Level 3 categories
  INSERT INTO public.category_search_index (
    search_term, category_id, category_level, category_name,
    level1_name, level1_slug, level2_name, level2_slug, level3_name, level3_slug, 
    display_label, search_url, is_synonym
  )
  SELECT 
    LOWER(l3.name) as search_term,
    l3.id as category_id,
    3 as category_level,
    l3.name as category_name,
    l1.name as level1_name,
    l1.slug as level1_slug,
    l2.name as level2_name,
    l2.slug as level2_slug,
    l3.name as level3_name,
    l3.slug as level3_slug,
    l1.name || ' ' || l3.name as display_label,
    '/shop?search=' || l1.name || ' ' || l3.name as search_url,
    false as is_synonym
  FROM public.product_sub_subcategories l3
  JOIN public.product_subcategories l2 ON l3.subcategory_id = l2.id
  JOIN public.product_categories l1 ON l2.category_id = l1.id
  WHERE l3.is_active = true AND l2.is_active = true AND l1.is_active = true;
  
  -- Insert Level 3 synonyms
  INSERT INTO public.category_search_index (
    search_term, category_id, category_level, category_name,
    level1_name, level1_slug, level2_name, level2_slug, level3_name, level3_slug,
    display_label, search_url, is_synonym
  )
  SELECT 
    LOWER(synonym) as search_term,
    l3.id as category_id,
    3 as category_level,
    l3.name as category_name,
    l1.name as level1_name,
    l1.slug as level1_slug,
    l2.name as level2_name,
    l2.slug as level2_slug,
    l3.name as level3_name,
    l3.slug as level3_slug,
    l1.name || ' ' || l3.name as display_label,
    '/shop?search=' || l1.name || ' ' || l3.name as search_url,
    true as is_synonym
  FROM public.product_sub_subcategories l3
  JOIN public.product_subcategories l2 ON l3.subcategory_id = l2.id
  JOIN public.product_categories l1 ON l2.category_id = l1.id,
  unnest(l3.synonyms) as synonym
  WHERE l3.is_active = true AND l2.is_active = true AND l1.is_active = true AND l3.synonyms IS NOT NULL;
  
  -- Insert Level 4 categories
  INSERT INTO public.category_search_index (
    search_term, category_id, category_level, category_name,
    level1_name, level1_slug, level2_name, level2_slug, level3_name, level3_slug,
    level4_name, level4_slug, display_label, search_url, is_synonym
  )
  SELECT 
    LOWER(l4.name) as search_term,
    l4.id as category_id,
    4 as category_level,
    l4.name as category_name,
    l1.name as level1_name,
    l1.slug as level1_slug,
    l2.name as level2_name,
    l2.slug as level2_slug,
    l3.name as level3_name,
    l3.slug as level3_slug,
    l4.name as level4_name,
    l4.slug as level4_slug,
    l1.name || ' ' || l4.name as display_label,
    '/shop?search=' || l1.name || ' ' || l4.name as search_url,
    false as is_synonym
  FROM public.product_sub_sub_subcategories l4
  JOIN public.product_sub_subcategories l3 ON l4.sub_subcategory_id = l3.id
  JOIN public.product_subcategories l2 ON l3.subcategory_id = l2.id
  JOIN public.product_categories l1 ON l2.category_id = l1.id
  WHERE l4.is_active = true AND l3.is_active = true AND l2.is_active = true AND l1.is_active = true;
  
  -- Insert Level 4 synonyms
  INSERT INTO public.category_search_index (
    search_term, category_id, category_level, category_name,
    level1_name, level1_slug, level2_name, level2_slug, level3_name, level3_slug,
    level4_name, level4_slug, display_label, search_url, is_synonym
  )
  SELECT 
    LOWER(synonym) as search_term,
    l4.id as category_id,
    4 as category_level,
    l4.name as category_name,
    l1.name as level1_name,
    l1.slug as level1_slug,
    l2.name as level2_name,
    l2.slug as level2_slug,
    l3.name as level3_name,
    l3.slug as level3_slug,
    l4.name as level4_name,
    l4.slug as level4_slug,
    l1.name || ' ' || l4.name as display_label,
    '/shop?search=' || l1.name || ' ' || l4.name as search_url,
    true as is_synonym
  FROM public.product_sub_sub_subcategories l4
  JOIN public.product_sub_subcategories l3 ON l4.sub_subcategory_id = l3.id
  JOIN public.product_subcategories l2 ON l3.subcategory_id = l2.id
  JOIN public.product_categories l1 ON l2.category_id = l1.id,
  unnest(l4.synonyms) as synonym
  WHERE l4.is_active = true AND l3.is_active = true AND l2.is_active = true AND l1.is_active = true AND l4.synonyms IS NOT NULL;
  
END;
$function$;