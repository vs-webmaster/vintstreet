-- Add webp flag column to listings table
ALTER TABLE public.listings
ADD COLUMN is_webp_main_image boolean DEFAULT false;

-- Create function to check if image is webp format
CREATE OR REPLACE FUNCTION public.check_webp_format(image_url text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN image_url ~* '\.webp(\?.*)?$';
END;
$$;

-- Create trigger function to automatically update webp flag
CREATE OR REPLACE FUNCTION public.update_listings_webp_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if main thumbnail is webp format
  NEW.is_webp_main_image := check_webp_format(COALESCE(NEW.thumbnail, ''));
  RETURN NEW;
END;
$$;

-- Create trigger to update flag on insert/update
CREATE OR REPLACE TRIGGER trigger_update_listings_webp_flag
BEFORE INSERT OR UPDATE OF thumbnail
ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_listings_webp_flag();

-- Update existing records
UPDATE public.listings
SET is_webp_main_image = check_webp_format(COALESCE(thumbnail, ''));

-- Create index for better performance when filtering by webp images
CREATE INDEX idx_listings_webp_main_image ON public.listings(is_webp_main_image) WHERE is_webp_main_image = true;