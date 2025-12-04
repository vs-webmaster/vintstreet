-- Add RLS policy to allow public read access to wishlist items 
-- when they belong to a user with an active shared wishlist
CREATE POLICY "Anyone can view wishlist items for shared wishlists"
  ON wishlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_wishlists
      WHERE shared_wishlists.user_id = wishlist.user_id
        AND shared_wishlists.is_active = true
    )
  );