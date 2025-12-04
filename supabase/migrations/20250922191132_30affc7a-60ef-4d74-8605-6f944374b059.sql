-- Insert dummy streams without user dependencies (for display purposes)
INSERT INTO public.streams (id, title, seller_id, thumbnail, category, start_time, status, viewer_count, description) VALUES
('stream-1', 'Summer Fashion Haul - Designer Dresses Live Demo', 'seller-1', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=800&fit=crop', 'Fashion', NOW(), 'live', 2847, 'Live fashion show featuring the latest summer collection'),
('stream-2', 'Latest iPhone 15 Unboxing & Tech Review', 'seller-2', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop', 'Electronics', NOW(), 'live', 5234, 'Complete unboxing and review of the new iPhone 15'),
('stream-3', 'Skincare Routine - Korean Beauty Products', 'seller-3', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=800&fit=crop', 'Beauty', NOW(), 'live', 1892, 'Korean skincare routine demonstration with product reviews'),
('stream-4', 'Home Fitness Equipment Demo & Workout', 'seller-4', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=800&fit=crop', 'Sports', NOW(), 'scheduled', 987, 'Home workout equipment demonstration and fitness tips'),
('stream-5', 'Cooking Show - Italian Pasta Making Live', 'seller-5', 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=800&fit=crop', 'Food', NOW(), 'live', 3421, 'Live pasta making class with traditional Italian recipes'),
('stream-6', 'Gaming Setup Tour - RGB Everything', 'seller-6', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=800&fit=crop', 'Electronics', NOW(), 'live', 4567, 'Complete gaming setup tour with RGB lighting showcase');

-- Create a view to combine streams with mock seller data
CREATE OR REPLACE VIEW stream_with_seller_info AS
SELECT 
  s.*,
  CASE s.seller_id
    WHEN 'seller-1' THEN 'FashionGuru'
    WHEN 'seller-2' THEN 'TechReviewer'  
    WHEN 'seller-3' THEN 'BeautyExpert'
    WHEN 'seller-4' THEN 'FitnessCoach'
    WHEN 'seller-5' THEN 'ChefMario'
    WHEN 'seller-6' THEN 'GamerPro'
    ELSE 'Unknown Seller'
  END as seller_name,
  CASE s.seller_id
    WHEN 'seller-1' THEN 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face'
    WHEN 'seller-2' THEN 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    WHEN 'seller-3' THEN 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    WHEN 'seller-4' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    WHEN 'seller-5' THEN 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face'
    WHEN 'seller-6' THEN 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'
    ELSE 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
  END as seller_avatar,
  CASE s.seller_id
    WHEN 'seller-1' THEN '$89.99'
    WHEN 'seller-2' THEN '$999'
    WHEN 'seller-3' THEN '$45'
    WHEN 'seller-4' THEN '$299'
    WHEN 'seller-5' THEN '$25'
    WHEN 'seller-6' THEN '$1,299'
    ELSE NULL
  END as price
FROM streams s;