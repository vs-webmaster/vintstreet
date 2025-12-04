-- Create attributes table for category-specific attributes
CREATE TABLE IF NOT EXISTS public.attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'date')),
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_attribute_values table for storing dynamic attribute values
CREATE TABLE IF NOT EXISTS public.product_attribute_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC,
  value_boolean BOOLEAN,
  value_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, attribute_id)
);

-- Enable RLS
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attributes
CREATE POLICY "Attributes are viewable by everyone"
  ON public.attributes FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage attributes"
  ON public.attributes FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for product_attribute_values
CREATE POLICY "Product attribute values are viewable by everyone"
  ON public.product_attribute_values FOR SELECT
  USING (true);

CREATE POLICY "Sellers can manage their product attributes"
  ON public.product_attribute_values FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = product_attribute_values.product_id
      AND listings.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = product_attribute_values.product_id
      AND listings.seller_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_attributes_category_id ON public.attributes(category_id);
CREATE INDEX idx_product_attribute_values_product_id ON public.product_attribute_values(product_id);
CREATE INDEX idx_product_attribute_values_attribute_id ON public.product_attribute_values(attribute_id);

-- Add trigger for updated_at
CREATE TRIGGER update_attributes_updated_at
  BEFORE UPDATE ON public.attributes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_attribute_values_updated_at
  BEFORE UPDATE ON public.product_attribute_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();