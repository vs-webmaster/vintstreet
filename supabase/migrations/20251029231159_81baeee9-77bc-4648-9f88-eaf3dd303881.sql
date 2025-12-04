-- Add slug column to product_sub_sub_subcategories table for SEO-friendly URLs
ALTER TABLE product_sub_sub_subcategories
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate unique slugs by combining full category path with row numbers for duplicates
WITH numbered_rows AS (
  SELECT
    pssc.id,
    lower(
      regexp_replace(
        COALESCE(pc.slug, regexp_replace(pc.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' ||
        COALESCE(psc.slug, regexp_replace(psc.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' ||
        COALESCE(ps.slug, regexp_replace(ps.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' ||
        regexp_replace(pssc.name, '[^a-zA-Z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      )
    ) as base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY lower(
        regexp_replace(
          COALESCE(pc.slug, regexp_replace(pc.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' ||
          COALESCE(psc.slug, regexp_replace(psc.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' ||
          COALESCE(ps.slug, regexp_replace(ps.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' ||
          regexp_replace(pssc.name, '[^a-zA-Z0-9]+', '-', 'g'),
          '-+', '-', 'g'
        )
      )
      ORDER BY pssc.created_at
    ) as row_num
  FROM product_sub_sub_subcategories pssc
  JOIN product_sub_subcategories ps ON pssc.sub_subcategory_id = ps.id
  JOIN product_subcategories psc ON ps.subcategory_id = psc.id
  JOIN product_categories pc ON psc.category_id = pc.id
  WHERE pssc.slug IS NULL
)
UPDATE product_sub_sub_subcategories pssc
SET slug = CASE
  WHEN nr.row_num = 1 THEN nr.base_slug
  ELSE nr.base_slug || '-' || nr.row_num
END
FROM numbered_rows nr
WHERE pssc.id = nr.id;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS product_sub_sub_subcategories_slug_key
ON product_sub_sub_subcategories(slug);

-- Make slug column NOT NULL after populating
ALTER TABLE product_sub_sub_subcategories
ALTER COLUMN slug SET NOT NULL;