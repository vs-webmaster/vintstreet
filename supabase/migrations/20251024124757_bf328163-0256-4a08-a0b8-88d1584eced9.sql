-- Add gender field to listings table
ALTER TABLE public.listings
ADD COLUMN gender text;