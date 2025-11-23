-- Add product_ean column to order_lines table
ALTER TABLE order_lines
ADD COLUMN IF NOT EXISTS product_ean TEXT;

-- Add comment
COMMENT ON COLUMN order_lines.product_ean IS 'Code-barres EAN du produit (copié depuis products.ean au moment de la commande)';
