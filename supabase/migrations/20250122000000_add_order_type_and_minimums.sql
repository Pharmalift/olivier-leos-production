-- Ajouter le champ minimum_order_quantity à la table products
ALTER TABLE products
ADD COLUMN minimum_order_quantity INTEGER NOT NULL DEFAULT 3;

COMMENT ON COLUMN products.minimum_order_quantity IS 'Quantité minimum de commande pour le réassort (3 unités par défaut, 6 pour certains produits)';

-- Ajouter le champ order_type à la table orders
ALTER TABLE orders
ADD COLUMN order_type TEXT CHECK (order_type IN ('implantation', 'reassort')) NOT NULL DEFAULT 'reassort';

COMMENT ON COLUMN orders.order_type IS 'Type de commande: implantation (première commande avec gamme pré-remplie) ou réassort (commande libre)';

-- Mettre à jour les minimums spécifiques pour certains produits
UPDATE products
SET minimum_order_quantity = 6
WHERE sku IN ('BR005OL20', 'SS080OL25');
