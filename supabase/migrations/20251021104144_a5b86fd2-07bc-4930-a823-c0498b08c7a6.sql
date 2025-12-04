-- Create system seller admins table
CREATE TABLE IF NOT EXISTS public.system_seller_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.system_seller_admins ENABLE ROW LEVEL SECURITY;

-- Super admins can manage system seller admins
CREATE POLICY "Super admins can manage system seller admins"
ON public.system_seller_admins
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- System seller admins can view themselves
CREATE POLICY "System seller admins can view all admins"
ON public.system_seller_admins
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  auth.uid() = user_id
);

-- Create function to check if user is system seller admin
CREATE OR REPLACE FUNCTION public.is_system_seller_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.system_seller_admins
    WHERE user_id = _user_id
      AND is_active = true
  ) OR has_role(_user_id, 'super_admin'::app_role)
$$;

-- Update seller_profiles RLS to allow system seller admins
CREATE POLICY "System seller admins can manage system seller profile"
ON public.seller_profiles
FOR ALL
USING (
  shop_name = 'VintStreet System' AND 
  is_system_seller_admin(auth.uid())
)
WITH CHECK (
  shop_name = 'VintStreet System' AND 
  is_system_seller_admin(auth.uid())
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_system_seller_admins_user_id ON public.system_seller_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_system_seller_admins_email ON public.system_seller_admins(email);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_system_seller_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_seller_admins_updated_at
BEFORE UPDATE ON public.system_seller_admins
FOR EACH ROW
EXECUTE FUNCTION public.update_system_seller_admins_updated_at();