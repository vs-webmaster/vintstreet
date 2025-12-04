-- Create shop_banners table
CREATE TABLE public.shop_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  button_text TEXT,
  button_link TEXT,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_banners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Banners are viewable by everyone" 
ON public.shop_banners 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Super admins can manage banners" 
ON public.shop_banners 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shop_banners_updated_at
BEFORE UPDATE ON public.shop_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();