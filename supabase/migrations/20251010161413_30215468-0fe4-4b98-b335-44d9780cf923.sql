-- Create founders_list table
CREATE TABLE IF NOT EXISTS public.founders_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  intent TEXT,
  interests TEXT[],
  price_range TEXT,
  selling_plans TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.founders_list ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert founder signups
CREATE POLICY "Anyone can sign up for founders list"
ON public.founders_list
FOR INSERT
WITH CHECK (true);

-- Only admins can view founder signups
CREATE POLICY "Admins can view founders list"
ON public.founders_list
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_founders_list_updated_at
BEFORE UPDATE ON public.founders_list
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint on email
CREATE UNIQUE INDEX founders_list_email_idx ON public.founders_list(email);