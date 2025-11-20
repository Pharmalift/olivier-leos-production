-- ============================================================================
-- L'OLIVIER DE LEOS - Correction de la contrainte de statut des commandes
-- ============================================================================
-- Remplace les valeurs anglaises par les valeurs françaises
-- Date: 2025-01-04
-- ============================================================================

-- Supprimer l'ancienne contrainte
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Ajouter la nouvelle contrainte avec les valeurs en français
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY['en_attente'::text, 'validée'::text, 'expédiée'::text, 'livrée'::text, 'annulée'::text]));

-- Mettre à jour les données existantes si nécessaire
UPDATE orders SET status = 'en_attente' WHERE status = 'draft';
UPDATE orders SET status = 'validée' WHERE status = 'confirmed';
UPDATE orders SET status = 'expédiée' WHERE status = 'processing';
UPDATE orders SET status = 'livrée' WHERE status = 'delivered';
UPDATE orders SET status = 'annulée' WHERE status = 'cancelled';
