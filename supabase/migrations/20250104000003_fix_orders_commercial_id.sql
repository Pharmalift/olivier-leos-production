-- ============================================================================
-- L'OLIVIER DE LEOS - Ajout de la colonne commercial_id dans orders
-- ============================================================================
-- Ajoute commercial_id ou renomme user_id en commercial_id
-- Date: 2025-01-04
-- ============================================================================

-- Option 1: Si user_id existe, le renommer
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'commercial_id'
  ) THEN
    ALTER TABLE orders RENAME COLUMN user_id TO commercial_id;
    RAISE NOTICE 'Colonne user_id renommée en commercial_id';
  END IF;
END $$;

-- Option 2: Si aucune des deux n'existe, créer commercial_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'commercial_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN commercial_id UUID REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Colonne commercial_id créée';
  END IF;
END $$;

-- Mettre à jour les politiques RLS si nécessaire
DROP POLICY IF EXISTS "commercials_view_own_orders" ON orders;
DROP POLICY IF EXISTS "commercials_create_orders" ON orders;
DROP POLICY IF EXISTS "commercials_update_own_orders" ON orders;

-- Recréer les politiques avec commercial_id
CREATE POLICY "commercials_view_own_orders"
  ON orders FOR SELECT
  USING (
    commercial_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "commercials_create_orders"
  ON orders FOR INSERT
  WITH CHECK (commercial_id = auth.uid());

CREATE POLICY "commercials_update_own_orders"
  ON orders FOR UPDATE
  USING (
    commercial_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
