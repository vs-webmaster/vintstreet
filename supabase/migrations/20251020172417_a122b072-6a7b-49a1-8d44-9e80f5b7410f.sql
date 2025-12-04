-- Add is_popular column to brands table
ALTER TABLE public.brands 
ADD COLUMN is_popular boolean DEFAULT false;