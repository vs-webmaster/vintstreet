-- Create function to grant admin role when user_id is linked to system_seller_admin
CREATE OR REPLACE FUNCTION public.grant_system_admin_role()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a user_id is linked to a system_seller_admin entry
  IF NEW.user_id IS NOT NULL AND NEW.is_active = true AND 
     (OLD.user_id IS NULL OR OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
    -- Insert or update user_roles to grant super_admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on system_seller_admins to grant role when user_id is added
DROP TRIGGER IF EXISTS on_system_admin_user_linked ON public.system_seller_admins;
CREATE TRIGGER on_system_admin_user_linked
  AFTER INSERT OR UPDATE ON public.system_seller_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_system_admin_role();

-- Update handle_new_user to check system_seller_admins and grant role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, user_id, email, user_type, username, full_name)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer'),
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Check if user email is in system_seller_admins
  SELECT * INTO admin_record
  FROM public.system_seller_admins
  WHERE email = NEW.email AND is_active = true
  LIMIT 1;
  
  IF FOUND THEN
    -- Update system_seller_admins with user_id
    UPDATE public.system_seller_admins
    SET user_id = NEW.id, updated_at = now()
    WHERE id = admin_record.id;
    
    -- Grant super_admin role (trigger will handle this, but we do it here too for immediate effect)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to sync existing system_seller_admins with user_roles
CREATE OR REPLACE FUNCTION public.sync_system_seller_admins()
RETURNS TABLE(
  synced_count INTEGER,
  already_synced INTEGER,
  pending_signup INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      -- Check if user exists with this email
      UPDATE public.system_seller_admins ssa
      SET user_id = au.id, updated_at = now()
      FROM auth.users au
      WHERE ssa.id = admin_rec.id 
        AND au.email = admin_rec.email
        AND ssa.user_id IS NULL;
      
      IF FOUND THEN
        -- Now grant role
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
      -- User_id exists, ensure they have role
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
$$;