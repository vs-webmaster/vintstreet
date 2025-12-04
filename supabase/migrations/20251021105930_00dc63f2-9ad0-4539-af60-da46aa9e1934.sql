-- Create function to get user_id by email
-- This is needed for assigning the system seller profile to a specific user
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
$$;