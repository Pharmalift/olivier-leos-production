-- ============================================================================
-- MIGRATION: Ajouter les colonnes manquantes aux tables existantes
-- ============================================================================
-- Cette migration ajoute les colonnes qui pourraient manquer si l'ancien
-- schéma a été utilisé
-- ============================================================================

-- Ajouter la colonne description à products si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'description'
  ) THEN
    ALTER TABLE products ADD COLUMN description TEXT;
  END IF;
END $$;

-- Ajouter la colonne image_url à products si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Ajouter la colonne updated_at à products si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE products ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Ajouter la colonne updated_at à users si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Ajouter la colonne notes à pharmacies si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pharmacies' AND column_name = 'notes'
  ) THEN
    ALTER TABLE pharmacies ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Ajouter la colonne updated_at à pharmacies si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pharmacies' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE pharmacies ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Ajouter la colonne updated_at à orders si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Ajouter les colonnes product_name et product_sku à order_lines si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_lines' AND column_name = 'product_name'
  ) THEN
    ALTER TABLE order_lines ADD COLUMN product_name TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_lines' AND column_name = 'product_sku'
  ) THEN
    ALTER TABLE order_lines ADD COLUMN product_sku TEXT;
  END IF;
END $$;

-- Ajouter les colonnes sent_at et created_at à email_logs si la table existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'email_logs' AND column_name = 'sent_at'
    ) THEN
      ALTER TABLE email_logs ADD COLUMN sent_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'email_logs' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE email_logs ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Créer ou remplacer les triggers pour updated_at si la fonction existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_products_updated_at ON products;
    CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_pharmacies_updated_at ON pharmacies;
    CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON pharmacies
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
    CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée : toutes les colonnes manquantes ont été ajoutées';
END $$;
