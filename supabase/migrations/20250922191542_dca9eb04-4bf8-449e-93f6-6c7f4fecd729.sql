-- Fix the function search path security warning
CREATE OR REPLACE FUNCTION get_seller_info(seller_uuid uuid)
RETURNS TABLE(
  seller_name text,
  seller_avatar text,
  price text
) 
LANGUAGE plpgsql 
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE seller_uuid::text
      WHEN '550e8400-e29b-41d4-a716-446655440011' THEN 'FashionGuru'::text
      WHEN '550e8400-e29b-41d4-a716-446655440012' THEN 'TechReviewer'::text
      WHEN '550e8400-e29b-41d4-a716-446655440013' THEN 'BeautyExpert'::text
      WHEN '550e8400-e29b-41d4-a716-446655440014' THEN 'FitnessCoach'::text
      WHEN '550e8400-e29b-41d4-a716-446655440015' THEN 'ChefMario'::text
      WHEN '550e8400-e29b-41d4-a716-446655440016' THEN 'GamerPro'::text
      ELSE 'Unknown Seller'::text
    END,
    CASE seller_uuid::text
      WHEN '550e8400-e29b-41d4-a716-446655440011' THEN 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face'::text
      WHEN '550e8400-e29b-41d4-a716-446655440012' THEN 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'::text
      WHEN '550e8400-e29b-41d4-a716-446655440013' THEN 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'::text
      WHEN '550e8400-e29b-41d4-a716-446655440014' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'::text
      WHEN '550e8400-e29b-41d4-a716-446655440015' THEN 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face'::text
      WHEN '550e8400-e29b-41d4-a716-446655440016' THEN 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'::text
      ELSE 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'::text
    END,
    CASE seller_uuid::text
      WHEN '550e8400-e29b-41d4-a716-446655440011' THEN '$89.99'::text
      WHEN '550e8400-e29b-41d4-a716-446655440012' THEN '$999'::text
      WHEN '550e8400-e29b-41d4-a716-446655440013' THEN '$45'::text
      WHEN '550e8400-e29b-41d4-a716-446655440014' THEN '$299'::text
      WHEN '550e8400-e29b-41d4-a716-446655440015' THEN '$25'::text
      WHEN '550e8400-e29b-41d4-a716-446655440016' THEN '$1,299'::text
      ELSE NULL::text
    END;
END;
$$;