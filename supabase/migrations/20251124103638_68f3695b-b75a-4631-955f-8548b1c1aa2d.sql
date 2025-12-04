-- Create attribute_groups table
CREATE TABLE IF NOT EXISTS public.attribute_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add group_id to attributes table
ALTER TABLE public.attributes 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.attribute_groups(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_attributes_group_id ON public.attributes(group_id);

-- Enable RLS on attribute_groups
ALTER TABLE public.attribute_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attribute_groups
CREATE POLICY "Attribute groups are viewable by everyone"
  ON public.attribute_groups
  FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage attribute groups"
  ON public.attribute_groups
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_attribute_groups_updated_at
  BEFORE UPDATE ON public.attribute_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();