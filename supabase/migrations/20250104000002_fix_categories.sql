-- ============================================================================
-- L'OLIVIER DE LEOS - Correction des catégories produits
-- ============================================================================
-- Normalisation des catégories pour correspondre aux types TypeScript
-- Date: 2025-01-04
-- ============================================================================

-- Mise à jour des catégories pour correspondre au format attendu
UPDATE products SET category = 'Soins Visage' WHERE UPPER(category) = 'SOINS VISAGE';
UPDATE products SET category = 'Soins Corps & Cheveux' WHERE UPPER(category) = 'SOINS CORPS & CHEVEUX';
UPDATE products SET category = 'Hôtel & Spa' WHERE UPPER(category) IN ('HÔTEL & SPA', 'HOTEL & SPA');
