-- Add public read access (SELECT) for shop sections and their product links
-- Idempotent creation of policies if missing

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'shop_sections' 
      AND policyname = 'Shop sections are viewable by everyone'
  ) THEN
    CREATE POLICY "Shop sections are viewable by everyone"
    ON public.shop_sections
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'shop_section_products' 
      AND policyname = 'Shop section products are viewable by everyone'
  ) THEN
    CREATE POLICY "Shop section products are viewable by everyone"
    ON public.shop_section_products
    FOR SELECT
    USING (EXISTS (
      SELECT 1 
      FROM public.shop_sections ss 
      WHERE ss.id = shop_section_id 
        AND ss.is_active = true
    ));
  END IF;
END $$;
