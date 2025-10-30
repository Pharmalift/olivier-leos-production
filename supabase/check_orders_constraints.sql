-- ============================================================================
-- VÉRIFIER LES CONTRAINTES SUR LA TABLE ORDERS
-- ============================================================================

-- 1. Voir toutes les contraintes CHECK sur orders
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'orders'
AND con.contype = 'c';

-- 2. Structure complète de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
