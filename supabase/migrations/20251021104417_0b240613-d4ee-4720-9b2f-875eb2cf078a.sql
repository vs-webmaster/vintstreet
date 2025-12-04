-- Create function to link admin emails to users on signup
CREATE OR REPLACE FUNCTION public.link_admin_email_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update system_seller_admins table when a new user signs up
  UPDATE public.system_seller_admins
  SET user_id = NEW.id,
      updated_at = now()
  WHERE email = NEW.email
    AND user_id IS NULL
    AND is_active = true;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users (if allowed) or use a different approach
-- Note: We cannot directly trigger on auth.users, so we'll create a webhook handler instead
-- For now, admins can manually update user_ids, or we can use a profile trigger

-- Alternative: Update admin when profile is created
CREATE OR REPLACE FUNCTION public.link_admin_on_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Update system_seller_admins if this email exists
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
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS link_admin_on_profile_insert ON public.profiles;
CREATE TRIGGER link_admin_on_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.link_admin_on_profile_creation();