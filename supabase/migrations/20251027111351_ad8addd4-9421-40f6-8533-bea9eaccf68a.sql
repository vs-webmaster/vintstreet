-- Add archived flag to listings for soft-archiving products
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Index for faster filtering by archived status
CREATE INDEX IF NOT EXISTS idx_listings_archived ON public.listings (archived);
