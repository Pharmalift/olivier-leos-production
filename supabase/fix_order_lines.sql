-- ============================================================================
-- CORRECTION DE LA TABLE ORDER_LINES
-- ============================================================================
-- Ajoute toutes les colonnes nécessaires pour les lignes de commande
-- ============================================================================

-- 1. Voir la structure actuelle
SELECT 'Structure actuelle de order_lines:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_lines'
ORDER BY ordinal_position;

-- 2. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Si la table existe déjà, ajouter les colonnes manquantes
DO $$
BEGIN
    -- Ajouter order_id si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'order_lines' AND column_name = 'order_id'
    ) THEN
        ALTER TABLE order_lines ADD COLUMN order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE;
        RAISE NOTICE 'Colonne order_id ajoutée';
    END IF;

    -- Ajouter product_id si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'order_lines' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE order_lines ADD COLUMN product_id UUID NOT NULL REFERENCES products(id);
        RAISE NOTICE 'Colonne product_id ajoutée';
    END IF;

    -- Ajouter quantity si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'order_lines' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE order_lines ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Colonne quantity ajoutée';
    END IF;

    -- Ajouter unit_price si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'order_lines' AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE order_lines ADD COLUMN unit_price DECIMAL(10,2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Colonne unit_price ajoutée';
    END IF;

    -- Ajouter line_total si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'order_lines' AND column_name = 'line_total'
    ) THEN
        ALTER TABLE order_lines ADD COLUMN line_total DECIMAL(10,2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Colonne line_total ajoutée';
    END IF;

    RAISE NOTICE 'Vérification terminée';
END $$;

-- 4. Vérifier le résultat final
SELECT 'Structure finale de order_lines:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'order_lines'
ORDER BY ordinal_position;
