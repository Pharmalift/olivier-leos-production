-- ============================================================================
-- MIGRATION: Créer les tables manquantes et compléter le schéma
-- ============================================================================
-- Cette migration crée toutes les tables qui n'existent pas encore
-- ============================================================================

-- Créer la table email_logs si elle n'existe pas
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

-- Index pour email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_order ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);

-- Activer RLS sur email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy pour email_logs (admins seulement)
DROP POLICY IF EXISTS "admins_view_email_logs" ON email_logs;
CREATE POLICY "admins_view_email_logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy pour permettre l'insertion via service role
DROP POLICY IF EXISTS "service_role_insert_email_logs" ON email_logs;
CREATE POLICY "service_role_insert_email_logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Créer la fonction update_updated_at_column si elle n'existe pas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Tables créées avec succès';
END $$;
