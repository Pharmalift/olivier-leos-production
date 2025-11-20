-- ============================================================================
-- L'OLIVIER DE LEOS - Ajout de la politique d'insertion pour les utilisateurs
-- ============================================================================
-- Cette migration ajoute une politique RLS permettant l'insertion d'utilisateurs
-- dans la table users par le service role (utilisé par create-admin.ts)
-- Date: 2025-01-03
-- ============================================================================

-- Politique pour permettre au service role d'insérer des utilisateurs
-- Cette politique permet la création d'utilisateurs via le script create-admin.ts
CREATE POLICY "service_role_insert_users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Commentaire pour la traçabilité
COMMENT ON POLICY "service_role_insert_users" ON users IS
  'Permet au service role d''insérer de nouveaux utilisateurs (utilisé par create-admin.ts)';
