-- ============================================================================
-- Ajouter la colonne 'notes' à la table orders
-- ============================================================================

-- Vérifier d'abord si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN notes TEXT;
        RAISE NOTICE 'Colonne notes ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne notes existe déjà';
    END IF;
END $$;

-- Vérifier le résultat
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
