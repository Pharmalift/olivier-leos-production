-- ============================================================================
-- L'OLIVIER DE LEOS - SCHEMA INITIAL
-- ============================================================================
-- Migration initiale pour l'application de gestion des commandes
-- Version: 1.0.0
-- Date: 2025-01-01
-- ============================================================================

-- ============================================================================
-- 1. TABLES PRINCIPALES
-- ============================================================================

-- Table Users (commerciaux et administrateurs)
-- Liée à auth.users de Supabase Authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('commercial', 'admin')) NOT NULL DEFAULT 'commercial',
  sector TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table Products (catalogue L'Olivier de Leos)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('Soins Visage', 'Soins Corps & Cheveux', 'Hôtel & Spa')) NOT NULL,
  description TEXT,
  pcb_price DECIMAL(10,2) NOT NULL CHECK (pcb_price >= 0),
  retail_price DECIMAL(10,2) NOT NULL CHECK (retail_price >= 0),
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00 CHECK (vat_rate >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table Pharmacies (clients)
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  sector TEXT NOT NULL,
  status TEXT CHECK (status IN ('actif', 'inactif', 'prospect')) NOT NULL DEFAULT 'prospect',
  assigned_commercial_id UUID REFERENCES users(id) ON DELETE SET NULL,
  first_contact_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table Pharmacy Notes (historique des notes/interactions)
CREATE TABLE IF NOT EXISTS pharmacy_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table Orders (commandes)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  commercial_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT CHECK (status IN ('en_attente', 'validée', 'expédiée', 'livrée', 'annulée')) NOT NULL DEFAULT 'en_attente',
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table Order Lines (lignes de commande)
CREATE TABLE IF NOT EXISTS order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  line_total DECIMAL(10,2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table Email Logs (historique des emails envoyés)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  email_type TEXT CHECK (email_type IN ('order_confirmation', 'admin_notification')) NOT NULL,
  subject TEXT NOT NULL,
  status TEXT CHECK (status IN ('sent', 'failed', 'pending')) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEX POUR PERFORMANCES
-- ============================================================================

-- Index sur users
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index sur products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Index sur pharmacies
CREATE INDEX IF NOT EXISTS idx_pharmacies_commercial ON pharmacies(assigned_commercial_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_sector ON pharmacies(sector);
CREATE INDEX IF NOT EXISTS idx_pharmacies_status ON pharmacies(status);
CREATE INDEX IF NOT EXISTS idx_pharmacies_city ON pharmacies(city);

-- Index sur pharmacy_notes
CREATE INDEX IF NOT EXISTS idx_pharmacy_notes_pharmacy ON pharmacy_notes(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_notes_user ON pharmacy_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_notes_created ON pharmacy_notes(created_at DESC);

-- Index sur orders
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy ON orders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_orders_commercial ON orders(commercial_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- Index sur order_lines
CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_product ON order_lines(product_id);

-- Index sur email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_order ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);

-- ============================================================================
-- 3. TRIGGERS POUR AUTO-UPDATE DES TIMESTAMPS
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers sur les tables avec updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES POUR USERS
-- ============================================================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "users_view_own_profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Les admins peuvent voir tous les utilisateurs
CREATE POLICY "admins_view_all_users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les admins peuvent modifier tous les utilisateurs
CREATE POLICY "admins_update_users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les admins peuvent supprimer des utilisateurs
CREATE POLICY "admins_delete_users"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES POUR PRODUCTS
-- ============================================================================

-- Tous les utilisateurs authentifiés peuvent voir les produits
CREATE POLICY "authenticated_view_products"
  ON products FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seuls les admins peuvent gérer les produits
CREATE POLICY "admins_manage_products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES POUR PHARMACIES
-- ============================================================================

-- Les commerciaux peuvent voir leurs pharmacies
CREATE POLICY "commercials_view_own_pharmacies"
  ON pharmacies FOR SELECT
  USING (
    assigned_commercial_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les commerciaux peuvent créer des pharmacies
CREATE POLICY "commercials_create_pharmacies"
  ON pharmacies FOR INSERT
  WITH CHECK (
    assigned_commercial_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les commerciaux peuvent modifier leurs pharmacies
CREATE POLICY "commercials_update_own_pharmacies"
  ON pharmacies FOR UPDATE
  USING (
    assigned_commercial_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les admins peuvent supprimer des pharmacies
CREATE POLICY "admins_delete_pharmacies"
  ON pharmacies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES POUR PHARMACY_NOTES
-- ============================================================================

-- Les utilisateurs peuvent voir les notes de leurs pharmacies
CREATE POLICY "users_view_pharmacy_notes"
  ON pharmacy_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pharmacies
      WHERE pharmacies.id = pharmacy_notes.pharmacy_id
      AND (pharmacies.assigned_commercial_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Les utilisateurs peuvent créer des notes pour leurs pharmacies
CREATE POLICY "users_insert_pharmacy_notes"
  ON pharmacy_notes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM pharmacies
      WHERE pharmacies.id = pharmacy_notes.pharmacy_id
      AND (pharmacies.assigned_commercial_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- ============================================================================
-- POLICIES POUR ORDERS
-- ============================================================================

-- Les commerciaux peuvent voir leurs commandes
CREATE POLICY "commercials_view_own_orders"
  ON orders FOR SELECT
  USING (
    commercial_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les commerciaux peuvent créer des commandes
CREATE POLICY "commercials_create_orders"
  ON orders FOR INSERT
  WITH CHECK (commercial_id = auth.uid());

-- Les commerciaux peuvent modifier leurs commandes
CREATE POLICY "commercials_update_own_orders"
  ON orders FOR UPDATE
  USING (
    commercial_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les admins peuvent supprimer des commandes
CREATE POLICY "admins_delete_orders"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES POUR ORDER_LINES
-- ============================================================================

-- Les utilisateurs peuvent voir les lignes de leurs commandes
CREATE POLICY "users_view_order_lines"
  ON order_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_lines.order_id
      AND (orders.commercial_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Les utilisateurs peuvent créer des lignes pour leurs commandes
CREATE POLICY "users_insert_order_lines"
  ON order_lines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_lines.order_id
      AND orders.commercial_id = auth.uid()
    )
  );

-- Les admins peuvent modifier toutes les lignes de commande
CREATE POLICY "admins_update_order_lines"
  ON order_lines FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les admins peuvent supprimer des lignes de commande
CREATE POLICY "admins_delete_order_lines"
  ON order_lines FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES POUR EMAIL_LOGS
-- ============================================================================

-- Seuls les admins peuvent voir les logs d'emails
CREATE POLICY "admins_view_email_logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les API routes peuvent insérer des logs d'emails
CREATE POLICY "service_role_insert_email_logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 5. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour générer un numéro de commande unique
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Format: OL-YYYYMMDD-XXXX (ex: OL-20250101-0001)
  counter := (
    SELECT COUNT(*) + 1
    FROM orders
    WHERE DATE(order_date) = CURRENT_DATE
  );

  new_number := 'OL-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Commentaires sur les tables
COMMENT ON TABLE users IS 'Utilisateurs de l''application (commerciaux et administrateurs)';
COMMENT ON TABLE products IS 'Catalogue des produits L''Olivier de Leos';
COMMENT ON TABLE pharmacies IS 'Liste des pharmacies clientes et prospects';
COMMENT ON TABLE pharmacy_notes IS 'Historique des notes et interactions avec les pharmacies';
COMMENT ON TABLE orders IS 'Commandes effectuées par les commerciaux';
COMMENT ON TABLE order_lines IS 'Lignes de détail des commandes';
COMMENT ON TABLE email_logs IS 'Historique des emails envoyés par le système';
