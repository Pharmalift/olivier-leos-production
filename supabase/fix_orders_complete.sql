-- ============================================================================
-- CORRECTION COMPLÈTE DE LA TABLE ORDERS
-- ============================================================================
-- Ajoute toutes les colonnes manquantes à la table orders
-- ============================================================================

-- 1. D'abord, voir la structure actuelle
SELECT 'Structure actuelle de la table orders:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Ajouter toutes les colonnes manquantes
DO $$
BEGIN
    -- Ajouter order_number si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'order_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_number TEXT;
        RAISE NOTICE 'Colonne order_number ajoutée';
    END IF;

    -- Ajouter order_date si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'order_date'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_date TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Colonne order_date ajoutée';
    END IF;

    -- Ajouter status si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'status'
    ) THEN
        ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'en_attente';
        RAISE NOTICE 'Colonne status ajoutée';
    END IF;

    -- Ajouter total_amount si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Colonne total_amount ajoutée';
    END IF;

    -- Ajouter notes si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN notes TEXT;
        RAISE NOTICE 'Colonne notes ajoutée';
    END IF;

    -- Ajouter created_at si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Colonne created_at ajoutée';
    END IF;

    RAISE NOTICE 'Toutes les colonnes ont été vérifiées/ajoutées';
END $$;

-- 3. Vérifier le résultat final
SELECT 'Structure finale de la table orders:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 4. Vérifier que order_lines existe et a les bonnes colonnes
SELECT 'Structure de la table order_lines:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_lines'
ORDER BY ordinal_position;
