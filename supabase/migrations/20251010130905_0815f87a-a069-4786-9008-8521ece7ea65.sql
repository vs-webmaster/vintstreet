-- Create seller_registrations table
CREATE TABLE public.seller_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  shop_name text,
  categories text[] NOT NULL DEFAULT '{}',
  selling_methods text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create waitlist_signups table
CREATE TABLE public.waitlist_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Policies for super admins to view seller registrations
CREATE POLICY "Super admins can view seller registrations"
ON public.seller_registrations
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can insert seller registrations"
ON public.seller_registrations
FOR INSERT
WITH CHECK (true);

-- Policies for super admins to view waitlist signups
CREATE POLICY "Super admins can view waitlist signups"
ON public.waitlist_signups
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can insert waitlist signups"
ON public.waitlist_signups
FOR INSERT
WITH CHECK (true);