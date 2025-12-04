-- Create blog categories table
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blog tags table
CREATE TABLE public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blog posts table
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  publish_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  featured_image TEXT,
  excerpt TEXT,
  category_id UUID REFERENCES public.blog_categories(id),
  seo_title TEXT,
  seo_description TEXT,
  reading_time INTEGER,
  hero_banner TEXT,
  cta_link TEXT,
  cta_label TEXT,
  visibility TEXT DEFAULT 'draft' CHECK (visibility IN ('draft', 'scheduled', 'published')),
  scheduled_publish_at TIMESTAMP WITH TIME ZONE,
  author_bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create blog post tags junction table
CREATE TABLE public.blog_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, tag_id)
);

-- Create blog post sections (content blocks)
CREATE TABLE public.blog_post_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'heading',
    'paragraph',
    'image',
    'quote',
    'list',
    'video',
    'gallery',
    'cta',
    'product_card',
    'divider',
    'author_note',
    'newsletter',
    'related_content'
  )),
  content JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blog post products (related products)
CREATE TABLE public.blog_post_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, product_id)
);

-- Create blog post related posts
CREATE TABLE public.blog_post_related_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  related_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, related_post_id),
  CHECK (post_id != related_post_id)
);

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_related_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
CREATE POLICY "Blog categories are viewable by everyone"
  ON public.blog_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage blog categories"
  ON public.blog_categories FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for blog_tags
CREATE POLICY "Blog tags are viewable by everyone"
  ON public.blog_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage blog tags"
  ON public.blog_tags FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for blog_posts
CREATE POLICY "Published blog posts are viewable by everyone"
  ON public.blog_posts FOR SELECT
  USING (
    visibility = 'published' 
    OR has_role(auth.uid(), 'super_admin'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for blog_post_tags
CREATE POLICY "Blog post tags are viewable by everyone"
  ON public.blog_post_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage blog post tags"
  ON public.blog_post_tags FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for blog_post_sections
CREATE POLICY "Blog post sections are viewable by everyone"
  ON public.blog_post_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts
      WHERE blog_posts.id = blog_post_sections.post_id
      AND (
        blog_posts.visibility = 'published'
        OR has_role(auth.uid(), 'super_admin'::app_role)
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "Admins can manage blog post sections"
  ON public.blog_post_sections FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for blog_post_products
CREATE POLICY "Blog post products are viewable by everyone"
  ON public.blog_post_products FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage blog post products"
  ON public.blog_post_products FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for blog_post_related_posts
CREATE POLICY "Blog post related posts are viewable by everyone"
  ON public.blog_post_related_posts FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage blog post related posts"
  ON public.blog_post_related_posts FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX idx_blog_posts_visibility ON public.blog_posts(visibility);
CREATE INDEX idx_blog_posts_publish_date ON public.blog_posts(publish_date DESC);
CREATE INDEX idx_blog_post_sections_post ON public.blog_post_sections(post_id);
CREATE INDEX idx_blog_post_tags_post ON public.blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag ON public.blog_post_tags(tag_id);

-- Create trigger for updated_at
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_post_sections_updated_at
  BEFORE UPDATE ON public.blog_post_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();