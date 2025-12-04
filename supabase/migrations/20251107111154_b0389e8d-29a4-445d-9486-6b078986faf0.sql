-- Create size guides table
CREATE TABLE public.size_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grading guides table
CREATE TABLE public.grading_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add size_guide_id and grading_guide_id to product_categories (Level 1)
ALTER TABLE public.product_categories
ADD COLUMN size_guide_id UUID REFERENCES public.size_guides(id) ON DELETE SET NULL,
ADD COLUMN grading_guide_id UUID REFERENCES public.grading_guides(id) ON DELETE SET NULL;

-- Add size_guide_id and grading_guide_id to product_subcategories (Level 2)
ALTER TABLE public.product_subcategories
ADD COLUMN size_guide_id UUID REFERENCES public.size_guides(id) ON DELETE SET NULL,
ADD COLUMN grading_guide_id UUID REFERENCES public.grading_guides(id) ON DELETE SET NULL;

-- Add size_guide_id and grading_guide_id to product_sub_subcategories (Level 3)
ALTER TABLE public.product_sub_subcategories
ADD COLUMN size_guide_id UUID REFERENCES public.size_guides(id) ON DELETE SET NULL,
ADD COLUMN grading_guide_id UUID REFERENCES public.grading_guides(id) ON DELETE SET NULL;

-- Add size_guide_id and grading_guide_id to product_sub_sub_subcategories (Level 4)
ALTER TABLE public.product_sub_sub_subcategories
ADD COLUMN size_guide_id UUID REFERENCES public.size_guides(id) ON DELETE SET NULL,
ADD COLUMN grading_guide_id UUID REFERENCES public.grading_guides(id) ON DELETE SET NULL;

-- Enable RLS on size_guides
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;

-- RLS policies for size_guides
CREATE POLICY "Size guides are viewable by everyone"
  ON public.size_guides FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage size guides"
  ON public.size_guides FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Enable RLS on grading_guides
ALTER TABLE public.grading_guides ENABLE ROW LEVEL SECURITY;

-- RLS policies for grading_guides
CREATE POLICY "Grading guides are viewable by everyone"
  ON public.grading_guides FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage grading guides"
  ON public.grading_guides FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger to update updated_at on size_guides
CREATE TRIGGER update_size_guides_updated_at
  BEFORE UPDATE ON public.size_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on grading_guides
CREATE TRIGGER update_grading_guides_updated_at
  BEFORE UPDATE ON public.grading_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();