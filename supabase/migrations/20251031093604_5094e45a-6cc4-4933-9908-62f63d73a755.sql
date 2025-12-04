-- Clear all products from the listings table
DELETE FROM listings;

-- Also clear related data
DELETE FROM product_attribute_values;
DELETE FROM product_tag_links;
DELETE FROM cart;
DELETE FROM offers;
DELETE FROM wishlist;