-- Create product_categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_subcategories table
CREATE TABLE public.product_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Add category and subcategory to listings table
ALTER TABLE public.listings
ADD COLUMN category_id UUID REFERENCES public.product_categories(id),
ADD COLUMN subcategory_id UUID REFERENCES public.product_subcategories(id);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_categories
CREATE POLICY "Categories are viewable by everyone"
ON public.product_categories
FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage categories"
ON public.product_categories
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for product_subcategories
CREATE POLICY "Subcategories are viewable by everyone"
ON public.product_subcategories
FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage subcategories"
ON public.product_subcategories
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create updated_at trigger for product_categories
CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for product_subcategories
CREATE TRIGGER update_product_subcategories_updated_at
BEFORE UPDATE ON public.product_subcategories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default categories
INSERT INTO public.product_categories (name, description, icon) VALUES
('Electronics', 'Electronic devices and accessories', '📱'),
('Fashion', 'Clothing and accessories', '👗'),
('Home & Garden', 'Home decor and garden supplies', '🏠'),
('Sports & Outdoors', 'Sports equipment and outdoor gear', '⚽'),
('Collectibles', 'Vintage and collectible items', '💎');