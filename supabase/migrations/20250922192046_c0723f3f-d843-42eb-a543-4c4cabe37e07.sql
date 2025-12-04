-- First create profiles for our dummy sellers
INSERT INTO public.profiles (user_id, username, full_name, user_type) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'FashionGuru', 'Sarah Johnson', 'seller'),
('550e8400-e29b-41d4-a716-446655440012', 'TechReviewer', 'Mike Chen', 'seller'),
('550e8400-e29b-41d4-a716-446655440013', 'BeautyExpert', 'Emma Kim', 'seller'),
('550e8400-e29b-41d4-a716-446655440014', 'FitnessCoach', 'Alex Rodriguez', 'seller'),
('550e8400-e29b-41d4-a716-446655440015', 'ChefMario', 'Mario Rossi', 'seller'),
('550e8400-e29b-41d4-a716-446655440016', 'GamerPro', 'David Lee', 'seller')
ON CONFLICT (user_id) DO UPDATE SET
username = EXCLUDED.username,
full_name = EXCLUDED.full_name,
user_type = EXCLUDED.user_type;

-- Create seller profiles for these users
INSERT INTO public.seller_profiles (user_id, shop_name, shop_description, contact_email, business_name) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'Fashion Central', 'Premium fashion and designer clothing for the modern woman. We specialize in elegant dresses, trendy outfits, and seasonal collections.', 'sarah@fashioncentral.com', 'Fashion Central LLC'),
('550e8400-e29b-41d4-a716-446655440012', 'Tech Haven', 'Your destination for the latest electronics and tech gadgets. From smartphones to smart home devices, we have it all.', 'mike@techhaven.com', 'Tech Haven Inc'),
('550e8400-e29b-41d4-a716-446655440013', 'Beauty Boutique', 'Korean beauty and skincare products for glowing, healthy skin. Authentic K-beauty brands and expert recommendations.', 'emma@beautyboutique.com', 'Beauty Boutique Co'),
('550e8400-e29b-41d4-a716-446655440014', 'Fitness Pro', 'Home fitness equipment and accessories for your health journey. Quality equipment for all fitness levels.', 'alex@fitnesspro.com', 'Fitness Pro Solutions'),
('550e8400-e29b-41d4-a716-446655440015', 'Chef Mario Kitchen', 'Authentic Italian cooking ingredients, tools, and pasta-making supplies. Bringing Italy to your kitchen.', 'mario@chefmario.com', 'Chef Mario Italian Imports'),
('550e8400-e29b-41d4-a716-446655440016', 'Gaming World', 'Gaming gear, RGB setups, and peripherals for the ultimate gaming experience. Professional esports equipment.', 'david@gamingworld.com', 'Gaming World Pro')
ON CONFLICT (user_id) DO UPDATE SET
shop_name = EXCLUDED.shop_name,
shop_description = EXCLUDED.shop_description,
contact_email = EXCLUDED.contact_email,
business_name = EXCLUDED.business_name;