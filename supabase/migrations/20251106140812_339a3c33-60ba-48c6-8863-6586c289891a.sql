-- Create function to efficiently find products missing a specific attribute value
CREATE OR REPLACE FUNCTION public.get_products_missing_attribute(
  p_attribute_id UUID,
  p_seller_id UUID DEFAULT NULL,
  p_archived BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(product_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Find all listings that are linked to categories requiring this attribute
  -- but have no non-empty value in product_attribute_values
  SELECT DISTINCT l.id AS product_id
  FROM listings l
  WHERE l.product_type = 'shop'
    AND l.archived = p_archived
    AND (p_seller_id IS NULL OR l.seller_id = p_seller_id)
    AND (
      -- Linked via Level 1 category
      EXISTS (
        SELECT 1 FROM attribute_categories ac
        WHERE ac.attribute_id = p_attribute_id
          AND ac.category_id = l.category_id
      )
      OR
      -- Linked via Level 2 subcategory
      EXISTS (
        SELECT 1 FROM attribute_subcategories asc2
        WHERE asc2.attribute_id = p_attribute_id
          AND asc2.subcategory_id = l.subcategory_id
      )
      OR
      -- Linked via Level 3 sub_subcategory
      EXISTS (
        SELECT 1 FROM attribute_sub_subcategories assc
        WHERE assc.attribute_id = p_attribute_id
          AND assc.sub_subcategory_id = l.sub_subcategory_id
      )
    )
    AND NOT EXISTS (
      -- Product has no non-empty attribute value
      SELECT 1 FROM product_attribute_values pav
      WHERE pav.product_id = l.id
        AND pav.attribute_id = p_attribute_id
        AND (
          (pav.value_text IS NOT NULL AND pav.value_text != '' AND pav.value_text != '[]')
          OR pav.value_number IS NOT NULL
          OR pav.value_boolean IS NOT NULL
          OR pav.value_date IS NOT NULL
        )
    );
$$;