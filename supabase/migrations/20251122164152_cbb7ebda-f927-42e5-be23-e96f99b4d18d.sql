-- Fix SECURITY DEFINER Functions with Mutable Search Path
-- Add proper search_path to all security definer functions

-- Fix notify_order_shipped function
CREATE OR REPLACE FUNCTION public.notify_order_shipped()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NEW.delivery_status = 'shipped' AND (OLD.delivery_status IS NULL OR OLD.delivery_status != 'shipped') THEN
    INSERT INTO public.notifications (user_id, type, title, message, order_id)
    VALUES (
      NEW.buyer_id,
      'order_shipped',
      'Order Shipped',
      'Your order has been shipped and is on its way!',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix notify_new_order function
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, order_id)
  VALUES (
    NEW.seller_id,
    'order_received',
    'New Order Received',
    'You have received a new order!',
    NEW.id
  );
  RETURN NEW;
END;
$function$;

-- Fix notify_new_follow function
CREATE OR REPLACE FUNCTION public.notify_new_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  follower_name TEXT;
BEGIN
  SELECT COALESCE(sp.shop_name, p.username, 'Someone')
  INTO follower_name
  FROM public.profiles p
  LEFT JOIN public.seller_profiles sp ON sp.user_id = p.user_id
  WHERE p.user_id = NEW.follower_id
  LIMIT 1;
  
  INSERT INTO public.notifications (user_id, type, title, message, follower_id)
  VALUES (
    NEW.followed_user_id,
    'new_follow',
    'New Follower',
    follower_name || ' started following you!',
    NEW.follower_id
  );
  RETURN NEW;
END;
$function$;

-- Fix update_listings_webp_flag function
CREATE OR REPLACE FUNCTION public.update_listings_webp_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.is_webp_main_image := check_webp_format(COALESCE(NEW.thumbnail, ''));
  RETURN NEW;
END;
$function$;

-- Fix link_admin_email_to_user function
CREATE OR REPLACE FUNCTION public.link_admin_email_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.system_seller_admins
  SET user_id = NEW.id,
      updated_at = now()
  WHERE email = NEW.email
    AND user_id IS NULL
    AND is_active = true;
  
  RETURN NEW;
END;
$function$;

-- Fix link_admin_on_profile_creation function
CREATE OR REPLACE FUNCTION public.link_admin_on_profile_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  IF user_email IS NOT NULL THEN
    UPDATE public.system_seller_admins
    SET user_id = NEW.user_id,
        updated_at = now()
    WHERE email = user_email
      AND user_id IS NULL
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix grant_system_admin_role function
CREATE OR REPLACE FUNCTION public.grant_system_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.is_active = true AND 
     (OLD.user_id IS NULL OR OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix set_funds_clearing_period function
CREATE OR REPLACE FUNCTION public.set_funds_clearing_period()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NEW.delivery_status = 'delivered' AND (OLD.delivery_status IS NULL OR OLD.delivery_status != 'delivered') THEN
    NEW.funds_available_at = NOW() + INTERVAL '2 days';
    NEW.payout_status = 'clearing';
  END IF;
  
  IF NEW.buyer_confirmed = true AND OLD.buyer_confirmed = false THEN
    NEW.funds_available_at = NOW();
    NEW.payout_status = 'available';
    NEW.funds_released = true;
  END IF;
  
  IF NEW.issue_reported = true AND OLD.issue_reported = false THEN
    NEW.payout_status = 'on_hold';
    NEW.funds_released = false;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix release_cleared_funds function
CREATE OR REPLACE FUNCTION public.release_cleared_funds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.orders
  SET 
    funds_released = true,
    payout_status = 'available'
  WHERE 
    payout_status = 'clearing'
    AND funds_available_at <= NOW()
    AND issue_reported = false
    AND funds_released = false;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  admin_record RECORD;
BEGIN
  INSERT INTO public.profiles (id, user_id, email, user_type, username, full_name)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer'),
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name'
  );
  
  SELECT * INTO admin_record
  FROM public.system_seller_admins
  WHERE email = NEW.email AND is_active = true
  LIMIT 1;
  
  IF FOUND THEN
    UPDATE public.system_seller_admins
    SET user_id = NEW.id, updated_at = now()
    WHERE id = admin_record.id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix update_listing_on_order function
CREATE OR REPLACE FUNCTION public.update_listing_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  listing_record RECORD;
  new_quantity INTEGER;
BEGIN
  IF NEW.status = 'completed' THEN
    SELECT stock_quantity, status INTO listing_record
    FROM public.listings
    WHERE id = NEW.listing_id;
    
    IF NOT FOUND OR listing_record.status = 'out_of_stock' THEN
      RETURN NEW;
    END IF;
    
    IF listing_record.stock_quantity IS NULL THEN
      UPDATE public.listings
      SET status = 'out_of_stock', stock_quantity = 0
      WHERE id = NEW.listing_id AND status != 'out_of_stock';
    ELSE
      new_quantity := listing_record.stock_quantity - NEW.quantity;
      
      IF new_quantity <= 0 THEN
        UPDATE public.listings
        SET stock_quantity = 0, status = 'out_of_stock'
        WHERE id = NEW.listing_id AND status != 'out_of_stock';
      ELSE
        UPDATE public.listings
        SET stock_quantity = GREATEST(0, new_quantity)
        WHERE id = NEW.listing_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix sync_system_seller_admins function
CREATE OR REPLACE FUNCTION public.sync_system_seller_admins()
RETURNS TABLE(synced_count integer, already_synced integer, pending_signup integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_synced_count INTEGER := 0;
  v_already_synced INTEGER := 0;
  v_pending_signup INTEGER := 0;
  admin_rec RECORD;
BEGIN
  FOR admin_rec IN 
    SELECT ssa.id, ssa.user_id, ssa.email, ssa.is_active
    FROM public.system_seller_admins ssa
    WHERE ssa.is_active = true
  LOOP
    IF admin_rec.user_id IS NULL THEN
      UPDATE public.system_seller_admins ssa
      SET user_id = au.id, updated_at = now()
      FROM auth.users au
      WHERE ssa.id = admin_rec.id 
        AND au.email = admin_rec.email
        AND ssa.user_id IS NULL;
      
      IF FOUND THEN
        INSERT INTO public.user_roles (user_id, role)
        SELECT au.id, 'super_admin'::app_role
        FROM auth.users au
        WHERE au.email = admin_rec.email
        ON CONFLICT (user_id, role) DO NOTHING;
        
        v_synced_count := v_synced_count + 1;
      ELSE
        v_pending_signup := v_pending_signup + 1;
      END IF;
    ELSE
      INSERT INTO public.user_roles (user_id, role)
      VALUES (admin_rec.user_id, 'super_admin'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
      
      IF FOUND THEN
        v_synced_count := v_synced_count + 1;
      ELSE
        v_already_synced := v_already_synced + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_synced_count, v_already_synced, v_pending_signup;
END;
$function$;

-- Improve RLS policies for messages table to address moderation access control
-- Ensure users can only read their own messages, and admins can see flagged messages

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all flagged messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update message status" ON public.messages;

-- Create proper RLS policies for messages
CREATE POLICY "Users can read their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = recipient_id
);

CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own sent messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins can view all flagged messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can update message status"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'super_admin'::app_role)
);