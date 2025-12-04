-- Enable pg_net extension for async HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to generate thumbnail via Edge Function
-- This function will be called by the trigger after INSERT or UPDATE
CREATE OR REPLACE FUNCTION public.generate_thumbnail_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT := 'https://quibvppxriibzfvhrhwv.supabase.co';
  service_role_key TEXT;
  should_generate BOOLEAN := false;
BEGIN
  -- Get service role key from configuration (must be set manually)
  -- To set it, run: ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'your_service_role_key';
  BEGIN
    service_role_key := current_setting('app.settings.supabase_service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    -- If not set, raise an error with instructions
    RAISE EXCEPTION 'Configuration parameter app.settings.supabase_service_role_key is not set. Please set it using: ALTER DATABASE postgres SET app.settings.supabase_service_role_key = ''your_service_role_key'';';
  END;

  -- Determine if we should generate a thumbnail
  IF TG_OP = 'INSERT' THEN
    -- On INSERT: generate if product_image exists and thumbnail doesn't
    should_generate := NEW.product_image IS NOT NULL 
                      AND NEW.product_image != '' 
                      AND (NEW.thumbnail IS NULL OR NEW.thumbnail = '');
  ELSIF TG_OP = 'UPDATE' THEN
    -- On UPDATE: generate if product_image changed and is not empty
    -- Also regenerate if thumbnail is empty (even if product_image didn't change)
    should_generate := NEW.product_image IS NOT NULL 
                      AND NEW.product_image != ''
                      AND (
                        -- Product image changed
                        (OLD.product_image IS DISTINCT FROM NEW.product_image)
                        OR
                        -- Thumbnail is missing (regenerate)
                        (NEW.thumbnail IS NULL OR NEW.thumbnail = '')
                      );
  END IF;

  -- Call Edge Function asynchronously via pg_net if needed
  -- The Edge Function only needs listingId - it will fetch product_image itself
  IF should_generate THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/generate-thumbnail',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'listingId', NEW.id::text
      ),
      timeout_milliseconds := 30000
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to generate thumbnail after INSERT or UPDATE of product_image
CREATE TRIGGER trigger_generate_thumbnail
AFTER INSERT OR UPDATE OF product_image
ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.generate_thumbnail_trigger();

-- Add comment explaining the trigger
COMMENT ON FUNCTION public.generate_thumbnail_trigger() IS 
'Trigger function that automatically generates a thumbnail from product_image (300px width, maintaining aspect ratio) when a listing is inserted or when product_image is updated. The thumbnail is saved to the thumbnail field. Uses pg_net to call the generate-thumbnail Edge Function asynchronously.';

COMMENT ON TRIGGER trigger_generate_thumbnail ON public.listings IS 
'Automatically generates a thumbnail from product_image (300px width) and saves it to the thumbnail field when a listing is inserted with a product_image but no thumbnail, or when product_image is updated.';
