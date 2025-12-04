-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'seller', 'both')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create buyer profiles for payment/shipping info
CREATE TABLE public.buyer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Shipping Information
  shipping_first_name TEXT,
  shipping_last_name TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT DEFAULT 'US',
  shipping_phone TEXT,
  -- Billing Information
  billing_first_name TEXT,
  billing_last_name TEXT,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT DEFAULT 'US',
  billing_phone TEXT,
  -- Payment preferences
  preferred_payment_method TEXT DEFAULT 'card',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seller profiles for shop info
CREATE TABLE public.seller_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Shop Information
  shop_type TEXT DEFAULT 'marketplace' CHECK (shop_type IN ('master', 'marketplace')),
  shop_name TEXT,
  shop_description TEXT,
  shop_logo_url TEXT,
  -- Contact Information
  contact_email TEXT,
  contact_phone TEXT,
  -- Return/Business Address
  business_name TEXT,
  return_address_line1 TEXT,
  return_address_line2 TEXT,
  return_city TEXT,
  return_state TEXT,
  return_postal_code TEXT,
  return_country TEXT DEFAULT 'US',
  -- Business Details
  tax_id TEXT,
  business_license TEXT,
  return_policy TEXT,
  shipping_policy TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for users following streams/sellers
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  followed_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, followed_user_id)
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Buyer profiles policies
CREATE POLICY "Users can view their own buyer profile" 
ON public.buyer_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own buyer profile" 
ON public.buyer_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own buyer profile" 
ON public.buyer_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Seller profiles policies
CREATE POLICY "Seller profiles are viewable by everyone" 
ON public.seller_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own seller profile" 
ON public.seller_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller profile" 
ON public.seller_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "Users can view follows" 
ON public.user_follows 
FOR SELECT 
USING (auth.uid() = follower_id OR auth.uid() = followed_user_id);

CREATE POLICY "Users can follow others" 
ON public.user_follows 
FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" 
ON public.user_follows 
FOR DELETE 
USING (auth.uid() = follower_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyer_profiles_updated_at
BEFORE UPDATE ON public.buyer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_profiles_updated_at
BEFORE UPDATE ON public.seller_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create profiles when user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Add indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_buyer_profiles_user_id ON public.buyer_profiles(user_id);
CREATE INDEX idx_seller_profiles_user_id ON public.seller_profiles(user_id);
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_followed ON public.user_follows(followed_user_id);