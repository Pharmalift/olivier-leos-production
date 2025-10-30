-- ============================================================================
-- L'OLIVIER DE LEOS - DONNÉES DE TEST ET PRODUITS
-- ============================================================================
-- Fichier de seed pour initialiser la base de données avec :
-- - Les 19 produits du catalogue L'Olivier de Leos
-- - Quelques pharmacies de test
-- - Quelques commandes exemple
-- ============================================================================

-- ============================================================================
-- 1. PRODUITS - CATALOGUE COMPLET L'OLIVIER DE LEOS (19 produits)
-- ============================================================================

-- SOINS VISAGE (9 produits)
INSERT INTO products (sku, name, category, description, pcb_price, retail_price, vat_rate, stock_quantity, is_active) VALUES
  -- Crèmes et soins hydratants
  ('OL-SV-001', 'Crème Hydratante Visage 50ml', 'Soins Visage', 'Crème hydratante quotidienne à l''huile d''olive bio et beurre de karité. Texture légère, non grasse. Convient à tous types de peaux.', 18.50, 28.90, 20.00, 150, true),
  ('OL-SV-002', 'Crème de Nuit Régénérante 50ml', 'Soins Visage', 'Soin de nuit intensif aux polyphénols d''olive et vitamine E. Régénère et répare la peau pendant le sommeil.', 22.00, 34.90, 20.00, 120, true),
  ('OL-SV-003', 'Crème Contour des Yeux 15ml', 'Soins Visage', 'Soin anti-âge ciblé pour le contour des yeux. Réduit les cernes et les poches. Formule enrichie en caféine et huile d''olive.', 16.00, 24.90, 20.00, 100, true),

  -- Sérums et concentrés
  ('OL-SV-004', 'Sérum Anti-Âge Intensif 30ml', 'Soins Visage', 'Sérum concentré en antioxydants naturels. Huile d''olive vierge extra, vitamine C et acide hyaluronique. Action anti-rides et raffermissante.', 28.00, 42.90, 20.00, 80, true),
  ('OL-SV-005', 'Sérum Éclat du Teint 30ml', 'Soins Visage', 'Sérum illuminateur aux extraits d''olive et d''agrumes. Unifie le teint et apporte de l''éclat. Texture légère à absorption rapide.', 26.00, 39.90, 20.00, 75, true),

  -- Nettoyants et gommages
  ('OL-SV-006', 'Mousse Nettoyante Douceur 150ml', 'Soins Visage', 'Mousse nettoyante délicate à l''huile d''olive et eau florale. Élimine les impuretés sans agresser. pH neutre.', 14.00, 21.90, 20.00, 180, true),
  ('OL-SV-007', 'Gommage Doux Visage 75ml', 'Soins Visage', 'Exfoliant doux aux micro-billes d''olive et miel. Affine le grain de peau. Utilisation 1 à 2 fois par semaine.', 15.50, 23.90, 20.00, 140, true),

  -- Masques
  ('OL-SV-008', 'Masque Purifiant à l''Argile 75ml', 'Soins Visage', 'Masque à l''argile verte et huile d''olive. Purifie les peaux mixtes à grasses. Resserre les pores.', 13.50, 20.90, 20.00, 110, true),
  ('OL-SV-009', 'Masque Hydratant Intensif 75ml', 'Soins Visage', 'Masque crème ultra-hydratant à l''huile d''olive et aloé vera. Idéal pour les peaux sèches et déshydratées.', 14.50, 22.90, 20.00, 105, true)

ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  pcb_price = EXCLUDED.pcb_price,
  retail_price = EXCLUDED.retail_price,
  stock_quantity = EXCLUDED.stock_quantity;

-- SOINS CORPS & CHEVEUX (7 produits)
INSERT INTO products (sku, name, category, description, pcb_price, retail_price, vat_rate, stock_quantity, is_active) VALUES
  -- Savons
  ('OL-SC-001', 'Savon Olive & Lavande 100g', 'Soins Corps & Cheveux', 'Savon artisanal saponifié à froid. 100% naturel, huile d''olive bio et lavande de Provence. Sans sulfates ni parabènes.', 6.50, 9.90, 20.00, 300, true),
  ('OL-SC-002', 'Savon Exfoliant Noyaux d''Olive 100g', 'Soins Corps & Cheveux', 'Savon gommant aux poudres de noyaux d''olive. Exfolie en douceur et nourrit la peau. Idéal pour le corps.', 7.00, 10.90, 20.00, 280, true),

  -- Soins corps
  ('OL-SC-003', 'Lait Corporel Hydratant 250ml', 'Soins Corps & Cheveux', 'Lait corps nourrissant à l''huile d''olive et beurre de cacao. Texture fluide, pénétration rapide. Parfum délicat.', 16.00, 24.90, 20.00, 160, true),
  ('OL-SC-004', 'Huile Corps Sèche 100ml', 'Soins Corps & Cheveux', 'Huile sèche multi-usage à l''huile d''olive vierge extra. Nourrit peau et cheveux. Fini non gras, pénétration immédiate.', 19.50, 29.90, 20.00, 130, true),
  ('OL-SC-005', 'Baume Mains Réparateur 75ml', 'Soins Corps & Cheveux', 'Baume ultra-nourrissant pour mains sèches et abîmées. Huile d''olive, karité et cire d''abeille. Protection longue durée.', 11.00, 16.90, 20.00, 200, true),

  -- Soins cheveux
  ('OL-SC-006', 'Shampoing Doux Tous Cheveux 250ml', 'Soins Corps & Cheveux', 'Shampoing doux à l''huile d''olive bio. Nettoie en douceur, apporte brillance et souplesse. Sans silicones.', 13.00, 19.90, 20.00, 170, true),
  ('OL-SC-007', 'Après-Shampoing Nutrition 250ml', 'Soins Corps & Cheveux', 'Soin démêlant nourrissant à l''huile d''olive et protéines de soie. Facilite le coiffage, apporte brillance.', 14.00, 21.90, 20.00, 155, true)

ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  pcb_price = EXCLUDED.pcb_price,
  retail_price = EXCLUDED.retail_price,
  stock_quantity = EXCLUDED.stock_quantity;

-- HÔTEL & SPA (3 produits)
INSERT INTO products (sku, name, category, description, pcb_price, retail_price, vat_rate, stock_quantity, is_active) VALUES
  ('OL-HS-001', 'Kit Spa Premium (Coffret 5 produits)', 'Hôtel & Spa', 'Coffret spa complet : gel douche 30ml, shampoing 30ml, après-shampoing 30ml, lait corps 30ml, savon 25g. Packaging luxe.', 42.00, 65.00, 20.00, 90, true),
  ('OL-HS-002', 'Set Hôtellerie Confort (Coffret 4 produits)', 'Hôtel & Spa', 'Set accueil hôtel : gel douche 30ml, shampoing 30ml, lait corps 30ml, savon 25g. Packaging élégant biodégradable.', 35.00, 52.00, 20.00, 110, true),
  ('OL-HS-003', 'Distributeur Mural Professionnel 1L', 'Hôtel & Spa', 'Distributeur mural rechargeable pour gel douche ou shampoing. Design épuré. Compatible avec tous nos produits en format professionnel.', 85.00, 125.00, 20.00, 45, true)

ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  pcb_price = EXCLUDED.pcb_price,
  retail_price = EXCLUDED.retail_price,
  stock_quantity = EXCLUDED.stock_quantity;

-- ============================================================================
-- 2. PHARMACIES DE TEST
-- ============================================================================

-- Note: Les UUIDs seront générés automatiquement
-- Les assigned_commercial_id devront être mis à jour manuellement après création des commerciaux

INSERT INTO pharmacies (name, address, postal_code, city, phone, email, sector, status, first_contact_date) VALUES
  ('Pharmacie de la Gare', '12 Avenue de la Gare', '06000', 'Nice', '04 93 88 12 34', 'contact@pharmacie-gare-nice.fr', 'PACA', 'actif', '2024-01-15'),
  ('Pharmacie du Centre', '45 Rue Principale', '13001', 'Marseille', '04 91 55 22 33', 'info@pharmacie-centre-marseille.fr', 'PACA', 'actif', '2024-02-20'),
  ('Pharmacie Saint-Jean', '8 Place Saint-Jean', '06400', 'Cannes', '04 93 39 44 55', 'pharmacie.stjean@orange.fr', 'PACA', 'actif', '2024-03-10'),
  ('Pharmacie Moderne', '23 Boulevard Victor Hugo', '06300', 'Nice', '04 93 87 66 77', 'moderne@pharmacie-nice.com', 'PACA', 'prospect', '2024-11-05'),
  ('Pharmacie des Pins', '67 Avenue des Pins', '83000', 'Toulon', '04 94 22 88 99', 'contact@pharmacie-pins.fr', 'PACA', 'prospect', '2024-12-01'),
  ('Pharmacie du Port', '34 Quai du Port', '13002', 'Marseille', '04 91 90 11 22', 'pharmacieduport@gmail.com', 'PACA', 'actif', '2024-04-18'),
  ('Pharmacie Centrale', '15 Rue de la République', '84000', 'Avignon', '04 90 82 33 44', 'centrale.avignon@pharmacie.fr', 'PACA', 'inactif', '2023-08-22'),
  ('Pharmacie Belle Vue', '89 Corniche Kennedy', '13007', 'Marseille', '04 91 52 55 66', 'bellevue@pharmacie-marseille.fr', 'PACA', 'actif', '2024-05-30')

ON CONFLICT (name, city) DO NOTHING;

-- ============================================================================
-- 3. NOTES SUR LES PHARMACIES (Exemples)
-- ============================================================================

-- Ces insertions nécessitent les IDs des pharmacies et users créés
-- À exécuter après avoir créé au moins un utilisateur commercial

-- Exemple de structure (à adapter avec les vrais IDs) :
-- INSERT INTO pharmacy_notes (pharmacy_id, user_id, note_text) VALUES
--   ('uuid-pharmacie-1', 'uuid-commercial-1', 'Premier contact très positif. Intéressée par la gamme visage.'),
--   ('uuid-pharmacie-1', 'uuid-commercial-1', 'Commande test passée. Retours clients excellents.');

-- ============================================================================
-- 4. COMMANDES EXEMPLE
-- ============================================================================

-- Ces insertions nécessitent les IDs des pharmacies, users et products
-- À exécuter manuellement après avoir créé les utilisateurs

-- Exemple de structure :
-- INSERT INTO orders (order_number, pharmacy_id, commercial_id, order_date, status, total_amount, notes) VALUES
--   ('OL-20250101-0001', 'uuid-pharmacie', 'uuid-commercial', NOW(), 'validée', 245.50, 'Première commande');

-- ============================================================================
-- 5. VÉRIFICATIONS
-- ============================================================================

-- Compter les produits insérés par catégorie
SELECT
  category,
  COUNT(*) as nombre_produits,
  SUM(stock_quantity) as stock_total
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- Afficher le catalogue complet
SELECT
  sku,
  name,
  category,
  pcb_price,
  retail_price,
  stock_quantity
FROM products
ORDER BY category, sku;

-- Compter les pharmacies par statut
SELECT
  status,
  COUNT(*) as nombre
FROM pharmacies
GROUP BY status
ORDER BY status;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================

-- 1. Les 19 produits correspondent au catalogue réel L'Olivier de Leos
-- 2. Les prix sont indicatifs et peuvent être ajustés
-- 3. Les stocks initiaux sont définis à des valeurs raisonnables
-- 4. Les pharmacies de test couvrent différents statuts et villes de PACA
-- 5. Pour créer des commandes, il faut d'abord :
--    a. Créer un utilisateur admin via le script create-admin.ts
--    b. Créer des commerciaux via l'interface admin
--    c. Assigner des commerciaux aux pharmacies
--    d. Créer des commandes via l'application

-- ============================================================================
-- FIN DU FICHIER DE SEED
-- ============================================================================
