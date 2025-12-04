-- Create function to update listing status when order is completed
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
    
    -- Skip if listing already sold or doesn't exist
    IF NOT FOUND OR listing_record.status = 'sold' THEN
      RETURN NEW;
    END IF;
    
    -- Handle single-item products (stock_quantity is null)
    IF listing_record.stock_quantity IS NULL THEN
      UPDATE public.listings
      SET status = 'sold', stock_quantity = 0
      WHERE id = NEW.listing_id AND status != 'sold';
    ELSE
      -- Handle stock-managed products
      new_quantity := listing_record.stock_quantity - NEW.quantity;
      
      IF new_quantity <= 0 THEN
        -- Out of stock - mark as sold
        UPDATE public.listings
        SET stock_quantity = 0, status = 'sold'
        WHERE id = NEW.listing_id AND status != 'sold';
      ELSE
        -- Decrease stock quantity
        UPDATE public.listings
        SET stock_quantity = GREATEST(0, new_quantity)
        WHERE id = NEW.listing_id AND status != 'sold';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_listing_on_order_trigger ON public.orders;

-- Create trigger that runs after INSERT or UPDATE on orders
CREATE TRIGGER update_listing_on_order_trigger
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_listing_on_order();