-- Create sub-subcategories table
CREATE TABLE IF NOT EXISTS public.product_sub_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_sub_subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sub-subcategories
CREATE POLICY "Sub-subcategories are viewable by everyone"
ON public.product_sub_subcategories
FOR SELECT
USING (true);

CREATE POLICY "Super admins can insert sub-subcategories"
ON public.product_sub_subcategories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update sub-subcategories"
ON public.product_sub_subcategories
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete sub-subcategories"
ON public.product_sub_subcategories
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));