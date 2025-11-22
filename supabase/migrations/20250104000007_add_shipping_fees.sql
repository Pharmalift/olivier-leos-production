-- Ajouter le champ shipping_amount à la table orders
ALTER TABLE orders
ADD COLUMN shipping_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN orders.shipping_amount IS 'Frais de port (9.90€ si total HT remisé < 300€, gratuit sinon)';
