
-- Fix SECURITY DEFINER functions with mutable search_path
-- This prevents privilege escalation attacks by fixing the search path

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

-- Restrict access to materialized view product_sales_status
-- Only authenticated users should have access
REVOKE ALL ON public.product_sales_status FROM anon;
GRANT SELECT ON public.product_sales_status TO authenticated;
