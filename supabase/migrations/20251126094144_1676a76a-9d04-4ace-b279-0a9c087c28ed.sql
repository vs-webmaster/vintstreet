-- Create support_faqs table for managing FAQ content
CREATE TABLE public.support_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create support_contact_cards table for contact methods
CREATE TABLE public.support_contact_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  link TEXT,
  email TEXT,
  phone TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create support_page_settings table for page title and metadata
CREATE TABLE public.support_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_title TEXT DEFAULT 'Support Center',
  page_description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_contact_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_page_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_faqs
CREATE POLICY "Anyone can view active FAQs"
  ON public.support_faqs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage FAQs"
  ON public.support_faqs FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for support_contact_cards
CREATE POLICY "Anyone can view active contact cards"
  ON public.support_contact_cards FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage contact cards"
  ON public.support_contact_cards FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for support_page_settings
CREATE POLICY "Anyone can view support settings"
  ON public.support_page_settings FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage support settings"
  ON public.support_page_settings FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_support_faqs_updated_at
  BEFORE UPDATE ON public.support_faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_contact_cards_updated_at
  BEFORE UPDATE ON public.support_contact_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_page_settings_updated_at
  BEFORE UPDATE ON public.support_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default support page settings
INSERT INTO public.support_page_settings (page_title, page_description)
VALUES ('Support Center', 'How can we help you today?');

-- Insert some default FAQs
INSERT INTO public.support_faqs (question, answer, display_order) VALUES
('How do I create an account?', 'Click on "Sign In" in the top navigation, then select "Sign Up" to create a new account. Fill in your details and verify your email.', 1),
('How do I list items for sale?', 'Once you have a seller account, go to your Seller Dashboard and click "Add Product" to create a new listing.', 2),
('What payment methods do you accept?', 'We accept all major credit cards and debit cards through our secure payment processor.', 3),
('How long does shipping take?', 'Shipping times vary by seller and location. Most items ship within 1-3 business days and arrive within 5-7 business days.', 4);

-- Insert default contact cards
INSERT INTO public.support_contact_cards (title, description, icon, email, display_order) VALUES
('Email Support', 'Send us an email and we''ll respond within 24 hours', 'Mail', 'support@vintstreet.com', 1),
('Live Chat', 'Chat with our support team in real-time', 'MessageCircle', NULL, 2),
('Help Center', 'Browse our comprehensive help articles', 'Book', NULL, 3);