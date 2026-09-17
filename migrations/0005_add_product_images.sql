-- Fold — Add images column to products table for multi-image gallery support.
-- Stores JSON array of image paths (e.g., ["images/a.jpeg","images/b.jpeg"]).
-- The primary cover image remains in the `image` column for backward compatibility.

ALTER TABLE products ADD COLUMN images TEXT;