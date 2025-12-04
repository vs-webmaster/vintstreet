-- Create junction table for attribute-subcategory relationships
CREATE TABLE public.attribute_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.product_subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(attribute_id, subcategory_id)
);

-- Enable RLS
ALTER TABLE public.attribute_subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Attribute subcategories are viewable by everyone"
ON public.attribute_subcategories
FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage attribute subcategories"
ON public.attribute_subcategories
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Create index for better performance
CREATE INDEX idx_attribute_subcategories_attribute_id ON public.attribute_subcategories(attribute_id);
CREATE INDEX idx_attribute_subcategories_subcategory_id ON public.attribute_subcategories(subcategory_id);

-- Add updated_at trigger
CREATE TRIGGER update_attribute_subcategories_updated_at
BEFORE UPDATE ON public.attribute_subcategories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();