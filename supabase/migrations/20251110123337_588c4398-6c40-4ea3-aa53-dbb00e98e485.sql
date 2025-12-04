-- Add image_link column to mega_menu_layouts table
ALTER TABLE public.mega_menu_layouts
ADD COLUMN image_link TEXT;

COMMENT ON COLUMN public.mega_menu_layouts.image_link IS 'URL that the mega menu image links to when clicked';