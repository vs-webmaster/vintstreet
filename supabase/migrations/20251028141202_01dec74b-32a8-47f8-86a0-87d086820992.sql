-- Remove gender column from listings table
ALTER TABLE public.listings DROP COLUMN IF EXISTS gender;