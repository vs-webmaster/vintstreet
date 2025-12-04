-- Fix search_path security warning for check_webp_format function
CREATE OR REPLACE FUNCTION public.check_webp_format(image_url text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN image_url ~* '\.webp(\?.*)?$';
END;
$$;