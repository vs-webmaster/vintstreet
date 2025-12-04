-- Update the check constraint to allow 'both' as a valid user_type
ALTER TABLE public.profiles DROP CONSTRAINT profiles_user_type_check;

-- Add new constraint that allows 'buyer', 'seller', and 'both'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type = ANY (ARRAY['buyer'::text, 'seller'::text, 'both'::text]));