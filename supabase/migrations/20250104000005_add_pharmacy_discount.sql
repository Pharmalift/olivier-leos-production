-- Ajouter le champ discount_rate à la table pharmacies
ALTER TABLE pharmacies
ADD COLUMN discount_rate NUMERIC(5,2) DEFAULT 21.00 CHECK (discount_rate IN (21.00, 24.00));

-- Mettre à jour les pharmacies existantes avec 21% par défaut
UPDATE pharmacies SET discount_rate = 21.00 WHERE discount_rate IS NULL;

-- Ajouter le champ discount_amount à la table orders pour stocker le montant de la remise
ALTER TABLE orders
ADD COLUMN discount_rate NUMERIC(5,2) DEFAULT 0,
ADD COLUMN discount_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN total_before_discount NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN pharmacies.discount_rate IS 'Taux de remise accordé à la pharmacie (21% ou 24%)';
COMMENT ON COLUMN orders.discount_rate IS 'Taux de remise appliqué à cette commande';
COMMENT ON COLUMN orders.discount_amount IS 'Montant de la remise en euros';
COMMENT ON COLUMN orders.total_before_discount IS 'Total avant remise';
