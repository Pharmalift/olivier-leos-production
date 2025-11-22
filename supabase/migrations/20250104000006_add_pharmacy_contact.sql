-- Ajouter le champ contact_name à la table pharmacies
ALTER TABLE pharmacies
ADD COLUMN contact_name VARCHAR(255);

COMMENT ON COLUMN pharmacies.contact_name IS 'Nom du contact principal de la pharmacie';
