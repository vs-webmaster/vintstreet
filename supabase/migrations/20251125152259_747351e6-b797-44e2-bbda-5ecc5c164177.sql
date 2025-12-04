-- Create table for promo message
CREATE TABLE public.promo_message (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL DEFAULT 'Free UK Shipping when you spend £60 or more',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_message ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read the promo message
CREATE POLICY "Anyone can view promo message"
ON public.promo_message
FOR SELECT
USING (true);

-- Only super admins can manage promo message
CREATE POLICY "Super admins can manage promo message"
ON public.promo_message
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Insert default message
INSERT INTO public.promo_message (message, is_active) 
VALUES ('Free UK Shipping when you spend £60 or more', true);

-- Create trigger for updated_at
CREATE TRIGGER update_promo_message_updated_at
BEFORE UPDATE ON public.promo_message
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();