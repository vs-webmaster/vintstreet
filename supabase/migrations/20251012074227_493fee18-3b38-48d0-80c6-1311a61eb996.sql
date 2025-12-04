-- Create attribute_options table to store dropdown/select options for attributes
CREATE TABLE public.attribute_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.attribute_options ENABLE ROW LEVEL SECURITY;

-- Everyone can view active options
CREATE POLICY "Attribute options are viewable by everyone"
ON public.attribute_options
FOR SELECT
USING (true);

-- Super admins can manage attribute options
CREATE POLICY "Super admins can manage attribute options"
ON public.attribute_options
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_attribute_options_attribute_id ON public.attribute_options(attribute_id);

-- Add trigger for updated_at
CREATE TRIGGER update_attribute_options_updated_at
BEFORE UPDATE ON public.attribute_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();