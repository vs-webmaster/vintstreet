-- Create site_content table to store Instagram posts and other site content
CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_post_1 TEXT,
  instagram_post_2 TEXT,
  instagram_post_3 TEXT,
  shop_features_title TEXT,
  shop_features_description TEXT,
  shop_feature_1_text TEXT,
  shop_feature_1_image TEXT,
  shop_feature_1_link TEXT,
  shop_feature_1_button_text TEXT;
  shop_feature_1_button_link TEXT;
  shop_feature_2_text TEXT,
  shop_feature_2_image TEXT,
  shop_feature_2_link TEXT,
  shop_feature_2_button_text TEXT;
  shop_feature_2_button_link TEXT;
  shop_feature_3_text TEXT,
  shop_feature_3_image TEXT,
  shop_feature_3_link TEXT,
  shop_feature_3_button_text TEXT;
  shop_feature_3_button_link TEXT;
  shop_feature_4_text TEXT,
  shop_feature_4_image TEXT,
  shop_feature_4_link TEXT,
  shop_feature_4_button_text TEXT;
  shop_feature_4_button_link TEXT;
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read site content
CREATE POLICY "Anyone can view site content"
ON public.site_content
FOR SELECT
TO authenticated
USING (true);

-- Only admins and super admins can manage site content
CREATE POLICY "Admins and super admins can manage site content"
ON site_content
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Insert initial empty record
INSERT INTO public.site_content (instagram_post_1, instagram_post_2, instagram_post_3)
VALUES ('', '', '')
ON CONFLICT DO NOTHING;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();