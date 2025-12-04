-- Create junction tables for many-to-many relationships

-- Size guide to categories junction tables
CREATE TABLE public.size_guide_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  size_guide_id UUID NOT NULL REFERENCES public.size_guides(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(size_guide_id, category_id)
);

CREATE TABLE public.size_guide_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  size_guide_id UUID NOT NULL REFERENCES public.size_guides(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.product_subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(size_guide_id, subcategory_id)
);

CREATE TABLE public.size_guide_sub_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  size_guide_id UUID NOT NULL REFERENCES public.size_guides(id) ON DELETE CASCADE,
  sub_subcategory_id UUID NOT NULL REFERENCES public.product_sub_subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(size_guide_id, sub_subcategory_id)
);

CREATE TABLE public.size_guide_sub_sub_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  size_guide_id UUID NOT NULL REFERENCES public.size_guides(id) ON DELETE CASCADE,
  sub_sub_subcategory_id UUID NOT NULL REFERENCES public.product_sub_sub_subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(size_guide_id, sub_sub_subcategory_id)
);

-- Grading guide junction tables
CREATE TABLE public.grading_guide_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grading_guide_id UUID NOT NULL REFERENCES public.grading_guides(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grading_guide_id, category_id)
);

CREATE TABLE public.grading_guide_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grading_guide_id UUID NOT NULL REFERENCES public.grading_guides(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.product_subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grading_guide_id, subcategory_id)
);

CREATE TABLE public.grading_guide_sub_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grading_guide_id UUID NOT NULL REFERENCES public.grading_guides(id) ON DELETE CASCADE,
  sub_subcategory_id UUID NOT NULL REFERENCES public.product_sub_subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grading_guide_id, sub_subcategory_id)
);

CREATE TABLE public.grading_guide_sub_sub_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grading_guide_id UUID NOT NULL REFERENCES public.grading_guides(id) ON DELETE CASCADE,
  sub_sub_subcategory_id UUID NOT NULL REFERENCES public.product_sub_sub_subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grading_guide_id, sub_sub_subcategory_id)
);

-- RLS policies for size guide junction tables
ALTER TABLE public.size_guide_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_guide_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_guide_sub_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_guide_sub_sub_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Size guide mappings viewable by everyone" ON public.size_guide_categories FOR SELECT USING (true);
CREATE POLICY "Size guide mappings viewable by everyone" ON public.size_guide_subcategories FOR SELECT USING (true);
CREATE POLICY "Size guide mappings viewable by everyone" ON public.size_guide_sub_subcategories FOR SELECT USING (true);
CREATE POLICY "Size guide mappings viewable by everyone" ON public.size_guide_sub_sub_subcategories FOR SELECT USING (true);

CREATE POLICY "Super admins manage size guide mappings" ON public.size_guide_categories FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins manage size guide mappings" ON public.size_guide_subcategories FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins manage size guide mappings" ON public.size_guide_sub_subcategories FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins manage size guide mappings" ON public.size_guide_sub_sub_subcategories FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS policies for grading guide junction tables
ALTER TABLE public.grading_guide_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_guide_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_guide_sub_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_guide_sub_sub_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Grading guide mappings viewable by everyone" ON public.grading_guide_categories FOR SELECT USING (true);
CREATE POLICY "Grading guide mappings viewable by everyone" ON public.grading_guide_subcategories FOR SELECT USING (true);
CREATE POLICY "Grading guide mappings viewable by everyone" ON public.grading_guide_sub_subcategories FOR SELECT USING (true);
CREATE POLICY "Grading guide mappings viewable by everyone" ON public.grading_guide_sub_sub_subcategories FOR SELECT USING (true);

CREATE POLICY "Super admins manage grading guide mappings" ON public.grading_guide_categories FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins manage grading guide mappings" ON public.grading_guide_subcategories FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins manage grading guide mappings" ON public.grading_guide_sub_subcategories FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins manage grading guide mappings" ON public.grading_guide_sub_sub_subcategories FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));