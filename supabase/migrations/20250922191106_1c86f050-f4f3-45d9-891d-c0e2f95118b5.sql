-- Insert dummy seller profiles
INSERT INTO public.seller_profiles (user_id, shop_name, shop_description, contact_email) VALUES
('11111111-1111-1111-1111-111111111111', 'Fashion Central', 'Premium fashion and designer clothing', 'fashion@example.com'),
('22222222-2222-2222-2222-222222222222', 'Tech Haven', 'Latest electronics and gadgets', 'tech@example.com'),
('33333333-3333-3333-3333-333333333333', 'Beauty Boutique', 'Korean beauty and skincare products', 'beauty@example.com'),
('44444444-4444-4444-4444-444444444444', 'Fitness Pro', 'Home fitness equipment and accessories', 'fitness@example.com'),
('55555555-5555-5555-5555-555555555555', 'Chef Mario Kitchen', 'Italian cooking ingredients and tools', 'chef@example.com'),
('66666666-6666-6666-6666-666666666666', 'Gaming World', 'Gaming gear and RGB setups', 'gaming@example.com');

-- Insert dummy profiles for these users
INSERT INTO public.profiles (user_id, username, full_name) VALUES
('11111111-1111-1111-1111-111111111111', 'FashionGuru', 'Sarah Johnson'),
('22222222-2222-2222-2222-222222222222', 'TechReviewer', 'Mike Chen'),
('33333333-3333-3333-3333-333333333333', 'BeautyExpert', 'Emma Kim'),
('44444444-4444-4444-4444-444444444444', 'FitnessCoach', 'Alex Rodriguez'),
('55555555-5555-5555-5555-555555555555', 'ChefMario', 'Mario Rossi'),
('66666666-6666-6666-6666-666666666666', 'GamerPro', 'David Lee');

-- Insert dummy streams
INSERT INTO public.streams (id, title, seller_id, thumbnail, category, start_time, status, viewer_count, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Summer Fashion Haul - Designer Dresses Live Demo', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=800&fit=crop', 'Fashion', NOW(), 'live', 2847, 'Live fashion show featuring the latest summer collection'),
('22222222-2222-2222-2222-222222222222', 'Latest iPhone 15 Unboxing & Tech Review', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop', 'Electronics', NOW(), 'live', 5234, 'Complete unboxing and review of the new iPhone 15'),
('33333333-3333-3333-3333-333333333333', 'Skincare Routine - Korean Beauty Products', '33333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=800&fit=crop', 'Beauty', NOW(), 'live', 1892, 'Korean skincare routine demonstration with product reviews'),
('44444444-4444-4444-4444-444444444444', 'Home Fitness Equipment Demo & Workout', '44444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=800&fit=crop', 'Sports', NOW(), 'scheduled', 987, 'Home workout equipment demonstration and fitness tips'),
('55555555-5555-5555-5555-555555555555', 'Cooking Show - Italian Pasta Making Live', '55555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=800&fit=crop', 'Food', NOW(), 'live', 3421, 'Live pasta making class with traditional Italian recipes'),
('66666666-6666-6666-6666-666666666666', 'Gaming Setup Tour - RGB Everything', '66666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=800&fit=crop', 'Electronics', NOW(), 'live', 4567, 'Complete gaming setup tour with RGB lighting showcase');

-- Insert dummy listings for these streams
INSERT INTO public.listings (seller_id, stream_id, product_name, product_description, starting_price, current_bid, is_active, thumbnail) VALUES
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Designer Summer Dress', 'Elegant summer dress from premium designer collection', 89.99, 95.00, true, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop'),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'iPhone 15 Pro Max', 'Latest iPhone 15 Pro Max with 1TB storage', 999.00, 1050.00, true, 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=400&fit=crop'),
('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Korean Skincare Set', 'Complete Korean skincare routine bundle', 45.00, 52.00, true, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'),
('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Home Fitness Bundle', 'Complete home fitness equipment set', 299.00, 320.00, false, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'),
('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Italian Pasta Kit', 'Authentic Italian pasta making kit with ingredients', 25.00, 28.00, true, 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=400&fit=crop'),
('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'RGB Gaming Setup', 'Complete RGB gaming setup with peripherals', 1299.00, 1350.00, true, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop');