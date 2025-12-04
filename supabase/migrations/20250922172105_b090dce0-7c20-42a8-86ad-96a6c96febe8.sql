-- Create user roles system
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY 
    CASE 
      WHEN role = 'super_admin' THEN 1
      WHEN role = 'admin' THEN 2
      WHEN role = 'user' THEN 3
    END
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create stream categories table
CREATE TABLE public.stream_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stream categories
ALTER TABLE public.stream_categories ENABLE ROW LEVEL SECURITY;

-- Stream categories policies
CREATE POLICY "Categories are viewable by everyone" 
ON public.stream_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Super admins can manage categories" 
ON public.stream_categories 
FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Insert default categories
INSERT INTO public.stream_categories (name, description, icon) VALUES
('Fashion', 'Clothing, accessories, and style', '👗'),
('Electronics', 'Tech gadgets and electronics', '📱'),
('Beauty', 'Makeup, skincare, and beauty products', '💄'),
('Sports', 'Sports equipment and fitness gear', '⚽'),
('Food', 'Food products and culinary items', '🍕'),
('Home', 'Home decor and furniture', '🏠'),
('Books', 'Books and educational materials', '📚'),
('Toys', 'Toys and games for all ages', '🧸');

-- Create trigger for categories timestamp updates
CREATE TRIGGER update_stream_categories_updated_at
BEFORE UPDATE ON public.stream_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_stream_categories_active ON public.stream_categories(is_active);