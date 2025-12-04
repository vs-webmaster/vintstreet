-- Add new columns to listings table
ALTER TABLE public.listings
ADD COLUMN colour_id uuid,
ADD COLUMN material_id uuid,
ADD COLUMN condition_id uuid;

-- Create colour_options table
CREATE TABLE public.colour_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  hex_code text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create material_options table
CREATE TABLE public.material_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create condition_options table
CREATE TABLE public.condition_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.colour_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condition_options ENABLE ROW LEVEL SECURITY;

-- RLS policies for colour_options
CREATE POLICY "Colour options are viewable by everyone"
ON public.colour_options FOR SELECT
USING (true);

CREATE POLICY "Super admins can insert colour options"
ON public.colour_options FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update colour options"
ON public.colour_options FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete colour options"
ON public.colour_options FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS policies for material_options
CREATE POLICY "Material options are viewable by everyone"
ON public.material_options FOR SELECT
USING (true);

CREATE POLICY "Super admins can insert material options"
ON public.material_options FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update material options"
ON public.material_options FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete material options"
ON public.material_options FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS policies for condition_options
CREATE POLICY "Condition options are viewable by everyone"
ON public.condition_options FOR SELECT
USING (true);

CREATE POLICY "Super admins can insert condition options"
ON public.condition_options FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update condition options"
ON public.condition_options FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete condition options"
ON public.condition_options FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Insert some default options
INSERT INTO public.colour_options (name, hex_code) VALUES
  ('Black', '#000000'),
  ('White', '#FFFFFF'),
  ('Red', '#FF0000'),
  ('Blue', '#0000FF'),
  ('Green', '#008000'),
  ('Yellow', '#FFFF00'),
  ('Pink', '#FFC0CB'),
  ('Grey', '#808080'),
  ('Brown', '#A52A2A'),
  ('Multi', NULL);

INSERT INTO public.material_options (name, description) VALUES
  ('Cotton', '100% Cotton'),
  ('Polyester', 'Synthetic polyester'),
  ('Leather', 'Genuine leather'),
  ('Suede', 'Suede material'),
  ('Denim', 'Denim fabric'),
  ('Wool', 'Natural wool'),
  ('Silk', 'Natural silk'),
  ('Synthetic', 'Synthetic materials'),
  ('Mixed', 'Mixed materials');

INSERT INTO public.condition_options (name, description) VALUES
  ('New', 'Brand new with tags'),
  ('Like New', 'Excellent condition, lightly used'),
  ('Very Good', 'Minor signs of wear'),
  ('Good', 'Some signs of wear but fully functional'),
  ('Fair', 'Noticeable wear but still usable'),
  ('Vintage', 'Vintage item with character');