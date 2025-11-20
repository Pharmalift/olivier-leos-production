-- ============================================================================
-- L'OLIVIER DE LEOS - Migration du schéma produits
-- ============================================================================
-- Cette migration ajoute les nouvelles colonnes et migre les données
-- Date: 2025-01-04
-- ============================================================================

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE products ADD COLUMN IF NOT EXISTS pcb_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS retail_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 20.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- 2. Migrer les données des anciennes colonnes vers les nouvelles
UPDATE products
SET
  pcb_price = price_ht,
  retail_price = price_ttc,
  vat_rate = 20.00,
  stock_quantity = 0
WHERE pcb_price IS NULL;

-- 3. Rendre les nouvelles colonnes NOT NULL maintenant qu'elles ont des valeurs
ALTER TABLE products ALTER COLUMN pcb_price SET NOT NULL;
ALTER TABLE products ALTER COLUMN retail_price SET NOT NULL;
ALTER TABLE products ALTER COLUMN vat_rate SET NOT NULL;
ALTER TABLE products ALTER COLUMN stock_quantity SET NOT NULL;

-- 4. Ajouter les contraintes CHECK
ALTER TABLE products ADD CONSTRAINT products_pcb_price_check CHECK (pcb_price >= 0);
ALTER TABLE products ADD CONSTRAINT products_retail_price_check CHECK (retail_price >= 0);
ALTER TABLE products ADD CONSTRAINT products_vat_rate_check CHECK (vat_rate >= 0);
ALTER TABLE products ADD CONSTRAINT products_stock_quantity_check CHECK (stock_quantity >= 0);

-- 5. Note: Les anciennes colonnes seront supprimées dans une migration ultérieure
-- pour des raisons de sécurité (permet un rollback si nécessaire)
COMMENT ON COLUMN products.price_ht IS 'DEPRECATED - Utiliser pcb_price';
COMMENT ON COLUMN products.price_ttc IS 'DEPRECATED - Utiliser retail_price';
COMMENT ON COLUMN products.pcb IS 'DEPRECATED - Information de packaging';
