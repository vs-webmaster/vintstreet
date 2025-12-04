-- Add out_of_stock status to listings table

-- First, drop the existing check constraint
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;

-- Add new check constraint that includes out_of_stock
ALTER TABLE public.listings
ADD CONSTRAINT listings_status_check
CHECK (status IN ('draft', 'published', 'private', 'out_of_stock'));

-- Update the trigger function to use out_of_stock status
CREATE OR REPLACE FUNCTION public.update_listing_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  listing_record RECORD;
  new_quantity INTEGER;
BEGIN
  -- Only proceed if order status is 'completed'
  IF NEW.status = 'completed' THEN
    -- Get the listing details
    SELECT stock_quantity, status INTO listing_record
    FROM public.listings
    WHERE id = NEW.listing_id;
    
    -- Skip if listing already marked as out_of_stock or doesn't exist
    IF NOT FOUND OR listing_record.status = 'out_of_stock' THEN
      RETURN NEW;
    END IF;
    
    -- Handle single-item products (stock_quantity is null)
    IF listing_record.stock_quantity IS NULL THEN
      UPDATE public.listings
      SET status = 'out_of_stock', stock_quantity = 0
      WHERE id = NEW.listing_id AND status != 'out_of_stock';
    ELSE
      -- Handle stock-managed products
      new_quantity := listing_record.stock_quantity - NEW.quantity;
      
      IF new_quantity <= 0 THEN
        -- Out of stock - mark as out_of_stock
        UPDATE public.listings
        SET stock_quantity = 0, status = 'out_of_stock'
        WHERE id = NEW.listing_id AND status != 'out_of_stock';
      ELSE
        -- Decrease stock quantity
        UPDATE public.listings
        SET stock_quantity = GREATEST(0, new_quantity)
        WHERE id = NEW.listing_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update existing products that are draft with 0 stock to out_of_stock
UPDATE public.listings
SET status = 'out_of_stock'
WHERE status = 'draft' 
  AND stock_quantity = 0;