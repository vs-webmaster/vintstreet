-- Atomic transaction to restructure gaming categories
BEGIN;

DO $$
DECLARE
  v_gaming_id uuid;
  v_games_old_id uuid;
  v_consoles_old_id uuid;
  v_games_new_id uuid;
  v_consoles_new_id uuid;
  v_old_subcat record;
BEGIN
  -- Step 1: Get or create Gaming category
  SELECT id INTO v_gaming_id FROM product_categories WHERE slug = 'gaming';
  
  IF v_gaming_id IS NULL THEN
    INSERT INTO product_categories (id, name, slug, description, is_active, display_order)
    VALUES (
      gen_random_uuid(),
      'Gaming',
      'gaming',
      'Video games, consoles, and gaming accessories',
      true,
      (SELECT COALESCE(MAX(display_order), 0) + 1 FROM product_categories)
    )
    RETURNING id INTO v_gaming_id;
  END IF;
  
  -- Get old Games and Consoles Level 1 IDs
  SELECT id INTO v_games_old_id FROM product_categories WHERE slug = 'games';
  SELECT id INTO v_consoles_old_id FROM product_categories WHERE slug = 'consoles';
  
  -- Exit if the old categories don't exist (migration already done)
  IF v_games_old_id IS NULL AND v_consoles_old_id IS NULL THEN
    RAISE NOTICE 'Migration already completed or categories not found';
    RETURN;
  END IF;
  
  -- Step 2: Convert 'Games' from Level 1 to Level 2 under 'Gaming'
  IF v_games_old_id IS NOT NULL THEN
    -- Check if it already exists as Level 2
    SELECT id INTO v_games_new_id FROM product_subcategories 
    WHERE slug = 'games' AND category_id = v_gaming_id;
    
    IF v_games_new_id IS NULL THEN
      INSERT INTO product_subcategories (id, name, slug, description, category_id, is_active, display_order, synonyms)
      SELECT 
        gen_random_uuid(),
        name,
        slug,
        description,
        v_gaming_id,
        is_active,
        display_order,
        synonyms
      FROM product_categories
      WHERE id = v_games_old_id
      RETURNING id INTO v_games_new_id;
    END IF;
  END IF;
  
  -- Convert 'Consoles' from Level 1 to Level 2 under 'Gaming'
  IF v_consoles_old_id IS NOT NULL THEN
    SELECT id INTO v_consoles_new_id FROM product_subcategories 
    WHERE slug = 'consoles' AND category_id = v_gaming_id;
    
    IF v_consoles_new_id IS NULL THEN
      INSERT INTO product_subcategories (id, name, slug, description, category_id, is_active, display_order, synonyms)
      SELECT 
        gen_random_uuid(),
        name,
        slug,
        description,
        v_gaming_id,
        is_active,
        display_order,
        synonyms
      FROM product_categories
      WHERE id = v_consoles_old_id
      RETURNING id INTO v_consoles_new_id;
    END IF;
  END IF;
  
  -- Step 3: Convert all Level 2 subcategories to Level 3
  -- For Games subcategories
  IF v_games_old_id IS NOT NULL THEN
    FOR v_old_subcat IN 
      SELECT * FROM product_subcategories WHERE category_id = v_games_old_id
    LOOP
      -- Check if already migrated
      IF NOT EXISTS (
        SELECT 1 FROM product_sub_subcategories 
        WHERE slug = v_old_subcat.slug AND subcategory_id = v_games_new_id
      ) THEN
        INSERT INTO product_sub_subcategories (
          id, name, slug, description, subcategory_id, is_active, synonyms
        ) VALUES (
          gen_random_uuid(),
          v_old_subcat.name,
          v_old_subcat.slug,
          v_old_subcat.description,
          v_games_new_id,
          v_old_subcat.is_active,
          v_old_subcat.synonyms
        );
      END IF;
      
      -- Step 4: Update listings that were under this old Level 2 subcategory
      UPDATE listings
      SET 
        category_id = v_gaming_id,
        subcategory_id = v_games_new_id,
        sub_subcategory_id = (
          SELECT id FROM product_sub_subcategories 
          WHERE slug = v_old_subcat.slug AND subcategory_id = v_games_new_id
        )
      WHERE subcategory_id = v_old_subcat.id;
      
      -- Step 5: Migrate attribute associations from Level 2 to Level 3
      INSERT INTO attribute_sub_subcategories (attribute_id, sub_subcategory_id)
      SELECT 
        attribute_id,
        (SELECT id FROM product_sub_subcategories 
         WHERE slug = v_old_subcat.slug AND subcategory_id = v_games_new_id)
      FROM attribute_subcategories
      WHERE subcategory_id = v_old_subcat.id
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Update listings that reference Games directly at Level 1 without subcategory
    UPDATE listings
    SET 
      category_id = v_gaming_id,
      subcategory_id = v_games_new_id
    WHERE category_id = v_games_old_id 
      AND subcategory_id IS NULL;
  END IF;
  
  -- For Consoles subcategories
  IF v_consoles_old_id IS NOT NULL THEN
    FOR v_old_subcat IN 
      SELECT * FROM product_subcategories WHERE category_id = v_consoles_old_id
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM product_sub_subcategories 
        WHERE slug = v_old_subcat.slug AND subcategory_id = v_consoles_new_id
      ) THEN
        INSERT INTO product_sub_subcategories (
          id, name, slug, description, subcategory_id, is_active, synonyms
        ) VALUES (
          gen_random_uuid(),
          v_old_subcat.name,
          v_old_subcat.slug,
          v_old_subcat.description,
          v_consoles_new_id,
          v_old_subcat.is_active,
          v_old_subcat.synonyms
        );
      END IF;
      
      -- Update listings
      UPDATE listings
      SET 
        category_id = v_gaming_id,
        subcategory_id = v_consoles_new_id,
        sub_subcategory_id = (
          SELECT id FROM product_sub_subcategories 
          WHERE slug = v_old_subcat.slug AND subcategory_id = v_consoles_new_id
        )
      WHERE subcategory_id = v_old_subcat.id;
      
      -- Migrate attribute associations
      INSERT INTO attribute_sub_subcategories (attribute_id, sub_subcategory_id)
      SELECT 
        attribute_id,
        (SELECT id FROM product_sub_subcategories 
         WHERE slug = v_old_subcat.slug AND subcategory_id = v_consoles_new_id)
      FROM attribute_subcategories
      WHERE subcategory_id = v_old_subcat.id
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Update listings that reference Consoles directly at Level 1 without subcategory
    UPDATE listings
    SET 
      category_id = v_gaming_id,
      subcategory_id = v_consoles_new_id
    WHERE category_id = v_consoles_old_id 
      AND subcategory_id IS NULL;
  END IF;
  
  -- Migrate Level 1 attribute associations for Games to Level 2
  IF v_games_old_id IS NOT NULL THEN
    INSERT INTO attribute_subcategories (attribute_id, subcategory_id)
    SELECT attribute_id, v_games_new_id
    FROM attribute_categories
    WHERE category_id = v_games_old_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Migrate Level 1 attribute associations for Consoles to Level 2
  IF v_consoles_old_id IS NOT NULL THEN
    INSERT INTO attribute_subcategories (attribute_id, subcategory_id)
    SELECT attribute_id, v_consoles_new_id
    FROM attribute_categories
    WHERE category_id = v_consoles_old_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Step 6: Clean up old data
  IF v_games_old_id IS NOT NULL OR v_consoles_old_id IS NOT NULL THEN
    -- Delete old attribute associations
    DELETE FROM attribute_subcategories 
    WHERE subcategory_id IN (
      SELECT id FROM product_subcategories 
      WHERE category_id IN (v_games_old_id, v_consoles_old_id)
    );
    
    DELETE FROM attribute_categories 
    WHERE category_id IN (v_games_old_id, v_consoles_old_id);
    
    -- Delete old Level 2 subcategories
    DELETE FROM product_subcategories 
    WHERE category_id IN (v_games_old_id, v_consoles_old_id);
    
    -- Delete old Level 1 categories (should be safe now that all listings are updated)
    DELETE FROM product_categories 
    WHERE id IN (v_games_old_id, v_consoles_old_id);
  END IF;
  
END $$;

-- Step 7: Rebuild the search index
SELECT rebuild_category_search_index();

COMMIT;