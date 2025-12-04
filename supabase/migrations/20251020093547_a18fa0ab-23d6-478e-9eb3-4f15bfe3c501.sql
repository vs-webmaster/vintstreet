-- Create sub-sub-sub categories table
CREATE TABLE IF NOT EXISTS public.product_sub_sub_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sub_subcategory_id UUID NOT NULL REFERENCES public.product_sub_subcategories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add sub_sub_subcategory_id to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS sub_sub_subcategory_id UUID REFERENCES public.product_sub_sub_subcategories(id);

-- Enable RLS on sub-sub-sub categories
ALTER TABLE public.product_sub_sub_subcategories ENABLE ROW LEVEL SECURITY;

-- Create policies for sub-sub-sub categories
CREATE POLICY "Sub-sub-subcategories are viewable by everyone"
ON public.product_sub_sub_subcategories
FOR SELECT
USING (true);

CREATE POLICY "Super admins can insert sub-sub-subcategories"
ON public.product_sub_sub_subcategories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update sub-sub-subcategories"
ON public.product_sub_sub_subcategories
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete sub-sub-subcategories"
ON public.product_sub_sub_subcategories
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_product_sub_sub_subcategories_updated_at
BEFORE UPDATE ON public.product_sub_sub_subcategories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();