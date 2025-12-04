-- Fix the trigger to use 'draft' status instead of 'sold'
CREATE OR REPLACE FUNCTION public.update_listing_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    
    -- Skip if listing already marked as draft (sold) or doesn't exist
    IF NOT FOUND OR listing_record.status = 'draft' THEN
      RETURN NEW;
    END IF;
    
    -- Handle single-item products (stock_quantity is null)
    IF listing_record.stock_quantity IS NULL THEN
      UPDATE public.listings
      SET status = 'draft', stock_quantity = 0
      WHERE id = NEW.listing_id AND status != 'draft';
    ELSE
      -- Handle stock-managed products
      new_quantity := listing_record.stock_quantity - NEW.quantity;
      
      IF new_quantity <= 0 THEN
        -- Out of stock - mark as draft (hide from marketplace)
        UPDATE public.listings
        SET stock_quantity = 0, status = 'draft'
        WHERE id = NEW.listing_id AND status != 'draft';
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
$$;

-- Fix existing listings that have completed orders
UPDATE public.listings
SET status = 'draft', stock_quantity = 0
WHERE status = 'published'
AND id IN (
  SELECT DISTINCT listing_id 
  FROM public.orders
  WHERE status = 'completed'
  AND listing_id = 'e7becd28-7943-479d-b7de-486b1406682b'
);