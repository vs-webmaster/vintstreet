-- Insert dummy streams with proper UUIDs
INSERT INTO public.streams (id, title, seller_id, thumbnail, category, start_time, status, viewer_count, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Summer Fashion Haul - Designer Dresses Live Demo', '550e8400-e29b-41d4-a716-446655440011', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=800&fit=crop', 'Fashion', NOW(), 'live', 2847, 'Live fashion show featuring the latest summer collection'),
('550e8400-e29b-41d4-a716-446655440002', 'Latest iPhone 15 Unboxing & Tech Review', '550e8400-e29b-41d4-a716-446655440012', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop', 'Electronics', NOW(), 'live', 5234, 'Complete unboxing and review of the new iPhone 15'),
('550e8400-e29b-41d4-a716-446655440003', 'Skincare Routine - Korean Beauty Products', '550e8400-e29b-41d4-a716-446655440013', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=800&fit=crop', 'Beauty', NOW(), 'live', 1892, 'Korean skincare routine demonstration with product reviews'),
('550e8400-e29b-41d4-a716-446655440004', 'Home Fitness Equipment Demo & Workout', '550e8400-e29b-41d4-a716-446655440014', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=800&fit=crop', 'Sports', NOW(), 'scheduled', 987, 'Home workout equipment demonstration and fitness tips'),
('550e8400-e29b-41d4-a716-446655440005', 'Cooking Show - Italian Pasta Making Live', '550e8400-e29b-41d4-a716-446655440015', 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=800&fit=crop', 'Food', NOW(), 'live', 3421, 'Live pasta making class with traditional Italian recipes'),
('550e8400-e29b-41d4-a716-446655440006', 'Gaming Setup Tour - RGB Everything', '550e8400-e29b-41d4-a716-446655440016', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=800&fit=crop', 'Electronics', NOW(), 'live', 4567, 'Complete gaming setup tour with RGB lighting showcase');

-- Create a view to combine streams with mock seller data
CREATE OR REPLACE VIEW stream_with_seller_info AS
SELECT 
  s.*,
  CASE s.seller_id::text
    WHEN '550e8400-e29b-41d4-a716-446655440011' THEN 'FashionGuru'
    WHEN '550e8400-e29b-41d4-a716-446655440012' THEN 'TechReviewer'  
    WHEN '550e8400-e29b-41d4-a716-446655440013' THEN 'BeautyExpert'
    WHEN '550e8400-e29b-41d4-a716-446655440014' THEN 'FitnessCoach'
    WHEN '550e8400-e29b-41d4-a716-446655440015' THEN 'ChefMario'
    WHEN '550e8400-e29b-41d4-a716-446655440016' THEN 'GamerPro'
    ELSE 'Unknown Seller'
  END as seller_name,
  CASE s.seller_id::text
    WHEN '550e8400-e29b-41d4-a716-446655440011' THEN 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face'
    WHEN '550e8400-e29b-41d4-a716-446655440012' THEN 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    WHEN '550e8400-e29b-41d4-a716-446655440013' THEN 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    WHEN '550e8400-e29b-41d4-a716-446655440014' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    WHEN '550e8400-e29b-41d4-a716-446655440015' THEN 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face'
    WHEN '550e8400-e29b-41d4-a716-446655440016' THEN 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'
    ELSE 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
  END as seller_avatar,
  CASE s.seller_id::text
    WHEN '550e8400-e29b-41d4-a716-446655440011' THEN '$89.99'
    WHEN '550e8400-e29b-41d4-a716-446655440012' THEN '$999'
    WHEN '550e8400-e29b-41d4-a716-446655440013' THEN '$45'
    WHEN '550e8400-e29b-41d4-a716-446655440014' THEN '$299'
    WHEN '550e8400-e29b-41d4-a716-446655440015' THEN '$25'
    WHEN '550e8400-e29b-41d4-a716-446655440016' THEN '$1,299'
    ELSE NULL
  END as price,
  CASE s.status 
    WHEN 'live' THEN true 
    ELSE false 
  END as is_live
FROM streams s;