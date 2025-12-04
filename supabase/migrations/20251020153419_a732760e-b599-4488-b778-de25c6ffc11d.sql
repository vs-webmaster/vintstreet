-- Create table for prohibited words/phrases
CREATE TABLE IF NOT EXISTS public.prohibited_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.prohibited_words ENABLE ROW LEVEL SECURITY;

-- Everyone can view active prohibited words (for validation)
CREATE POLICY "Everyone can view active prohibited words"
ON public.prohibited_words
FOR SELECT
USING (is_active = true);

-- Super admins can manage prohibited words
CREATE POLICY "Super admins can manage prohibited words"
ON public.prohibited_words
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_prohibited_words_updated_at
BEFORE UPDATE ON public.prohibited_words
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_prohibited_words_active ON public.prohibited_words(is_active) WHERE is_active = true;