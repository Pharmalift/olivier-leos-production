-- Schema SQL pour L'Olivier de Leos
-- À exécuter dans le SQL Editor de Supabase

-- 1. Table Users (commerciaux et admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('commercial', 'admin')) NOT NULL,
  sector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table Products (catalogue L'Olivier)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('Soins Visage', 'Soins Corps & Cheveux', 'Hôtel & Spa')) NOT NULL,
  description TEXT,
  pcb_price DECIMAL(10,2) NOT NULL,
  retail_price DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table Pharmacies
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  sector TEXT NOT NULL,
  status TEXT CHECK (status IN ('actif', 'inactif', 'prospect')) DEFAULT 'prospect',
  assigned_commercial_id UUID REFERENCES users(id) ON DELETE SET NULL,
  first_contact_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table Pharmacy Notes
CREATE TABLE IF NOT EXISTS pharmacy_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  commercial_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('en_attente', 'validée', 'expédiée', 'livrée', 'annulée')) DEFAULT 'en_attente',
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table Order Lines
CREATE TABLE IF NOT EXISTS order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pharmacies_commercial ON pharmacies(assigned_commercial_id);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy ON orders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_orders_commercial ON orders(commercial_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_notes_pharmacy ON pharmacy_notes(pharmacy_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;

-- Policies pour users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour products (lecture pour tous les utilisateurs authentifiés)
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policies pour pharmacies
CREATE POLICY "Commercials can view their pharmacies"
  ON pharmacies FOR SELECT
  USING (
    assigned_commercial_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all pharmacies"
  ON pharmacies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour pharmacy_notes
CREATE POLICY "Users can view notes for their pharmacies"
  ON pharmacy_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pharmacies
      WHERE pharmacies.id = pharmacy_notes.pharmacy_id
      AND (pharmacies.assigned_commercial_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Users can insert notes for their pharmacies"
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

-- Policies pour orders
CREATE POLICY "Commercials can view their orders"
  ON orders FOR SELECT
  USING (
    commercial_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Commercials can create orders"
  ON orders FOR INSERT
  WITH CHECK (commercial_id = auth.uid());

CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour order_lines
CREATE POLICY "Users can view order lines for their orders"
  ON order_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_lines.order_id
      AND (orders.commercial_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Users can insert order lines for their orders"
  ON order_lines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_lines.order_id
      AND orders.commercial_id = auth.uid()
    )
  );

-- 7. Table Email Logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  email_type TEXT CHECK (email_type IN ('order_confirmation', 'admin_notification')) NOT NULL,
  subject TEXT NOT NULL,
  status TEXT CHECK (status IN ('sent', 'failed', 'pending')) DEFAULT 'pending',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances des email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_order ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- RLS pour email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour email_logs (accessible uniquement aux admins)
CREATE POLICY "Admins can view all email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Données de test (optionnel)
-- Produits exemple
INSERT INTO products (sku, name, category, description, pcb_price, retail_price, stock_quantity) VALUES
  ('OL-SV-001', 'Crème Hydratante Visage', 'Soins Visage', 'Crème hydratante à l''huile d''olive', 24.50, 35.00, 100),
  ('OL-SV-002', 'Sérum Anti-Âge', 'Soins Visage', 'Sérum concentré aux antioxydants', 32.00, 48.00, 75),
  ('OL-SC-001', 'Savon Olive & Lavande', 'Soins Corps & Cheveux', 'Savon artisanal 100% naturel', 8.50, 12.00, 200),
  ('OL-SC-002', 'Shampoing Doux', 'Soins Corps & Cheveux', 'Shampoing à l''huile d''olive bio', 15.00, 22.00, 150),
  ('OL-HS-001', 'Kit Spa Hôtel', 'Hôtel & Spa', 'Coffret soins complet pour hôtels', 45.00, 65.00, 50)
ON CONFLICT (sku) DO NOTHING;
