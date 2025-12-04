-- Function to automatically set funds_available_at when order is delivered
CREATE OR REPLACE FUNCTION public.set_funds_clearing_period()
RETURNS TRIGGER AS $$
BEGIN
  -- When delivery status changes to 'delivered', start 2-day clearing period
  IF NEW.delivery_status = 'delivered' AND (OLD.delivery_status IS NULL OR OLD.delivery_status != 'delivered') THEN
    NEW.funds_available_at = NOW() + INTERVAL '2 days';
    NEW.payout_status = 'clearing';
  END IF;
  
  -- If buyer confirms, make funds available immediately
  IF NEW.buyer_confirmed = true AND OLD.buyer_confirmed = false THEN
    NEW.funds_available_at = NOW();
    NEW.payout_status = 'available';
    NEW.funds_released = true;
  END IF;
  
  -- If issue is reported, put funds on hold
  IF NEW.issue_reported = true AND OLD.issue_reported = false THEN
    NEW.payout_status = 'on_hold';
    NEW.funds_released = false;
  END IF;
  
  -- If issue is resolved (no longer reported), clear the description
  IF NEW.issue_reported = false AND OLD.issue_reported = true THEN
    NEW.issue_description = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic clearing period management
DROP TRIGGER IF EXISTS trigger_set_funds_clearing_period ON public.orders;
CREATE TRIGGER trigger_set_funds_clearing_period
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_funds_clearing_period();

-- Function to check and release funds after clearing period
CREATE OR REPLACE FUNCTION public.release_cleared_funds()
RETURNS void AS $$
BEGIN
  UPDATE public.orders
  SET 
    funds_released = true,
    payout_status = 'available'
  WHERE 
    payout_status = 'clearing'
    AND funds_available_at <= NOW()
    AND issue_reported = false
    AND issue_description IS NULL
    AND funds_released = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.release_cleared_funds() IS 'Run this function periodically (e.g., via cron) to release funds after clearing period';

-- Add RLS policies for new fields
CREATE POLICY "Buyers can confirm receipt" ON public.orders
  FOR UPDATE
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can report issues" ON public.orders
  FOR UPDATE
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);