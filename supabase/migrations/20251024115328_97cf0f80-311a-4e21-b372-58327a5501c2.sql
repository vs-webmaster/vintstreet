-- Add excerpt field to listings table
ALTER TABLE public.listings
ADD COLUMN excerpt text;