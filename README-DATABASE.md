# 🗄️ Base de Données - L'Olivier de Leos

## 📋 Vue d'ensemble

Ce document décrit la structure de la base de données PostgreSQL (Supabase) pour l'application de gestion des commandes L'Olivier de Leos.

### Tables principales

| Table | Description | Enregistrements |
|-------|-------------|-----------------|
| `users` | Utilisateurs (commerciaux et admins) | Variable |
| `products` | Catalogue des 19 produits | 19 |
| `pharmacies` | Clients et prospects | Variable |
| `pharmacy_notes` | Historique des interactions | Variable |
| `orders` | Commandes | Variable |
| `order_lines` | Lignes de commande | Variable |
| `email_logs` | Logs des emails envoyés | Variable |

---

## 🚀 Installation et Configuration

### 1. Prérequis

- Compte Supabase actif : https://supabase.com
- Projet Supabase créé
- Accès au SQL Editor de Supabase

### 2. Exécuter les migrations

#### Option A : Via le SQL Editor de Supabase (Recommandé)

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **SQL Editor**
3. Cliquez sur **New Query**
4. Copiez le contenu de `supabase/migrations/20250101000000_init.sql`
5. Collez-le dans l'éditeur
6. Cliquez sur **Run** (ou Ctrl/Cmd + Enter)
7. Attendez la fin de l'exécution (environ 5-10 secondes)

#### Option B : Via Supabase CLI

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à votre projet
supabase login
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

### 3. Importer les données de test

Après avoir exécuté la migration initiale :

1. Retournez au **SQL Editor**
2. Créez une nouvelle requête
3. Copiez le contenu de `supabase/seed.sql`
4. Collez et exécutez
5. Vérifiez l'import avec les requêtes de vérification en fin de fichier

---

## 📊 Structure des Tables

### Table `users`

Utilisateurs de l'application (commerciaux et administrateurs).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire, référence auth.users |
| `email` | TEXT | Email unique |
| `full_name` | TEXT | Nom complet |
| `role` | TEXT | 'commercial' ou 'admin' |
| `sector` | TEXT | Secteur géographique (ex: 'PACA') |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Dernière mise à jour |

**Index :** `idx_users_role`, `idx_users_email`

---

### Table `products`

Catalogue des produits L'Olivier de Leos (19 produits).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `sku` | TEXT | Code produit unique (ex: 'OL-SV-001') |
| `name` | TEXT | Nom du produit |
| `category` | TEXT | 'Soins Visage', 'Soins Corps & Cheveux', 'Hôtel & Spa' |
| `description` | TEXT | Description détaillée |
| `pcb_price` | DECIMAL(10,2) | Prix pharmacie (HT) |
| `retail_price` | DECIMAL(10,2) | Prix public conseillé (TTC) |
| `vat_rate` | DECIMAL(5,2) | Taux de TVA (défaut: 20%) |
| `stock_quantity` | INTEGER | Quantité en stock |
| `is_active` | BOOLEAN | Produit actif/inactif |
| `image_url` | TEXT | URL de l'image produit |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Dernière mise à jour |

**Index :** `idx_products_category`, `idx_products_sku`, `idx_products_active`

#### Catégories de produits

- **Soins Visage** : 9 produits (crèmes, sérums, nettoyants, masques)
- **Soins Corps & Cheveux** : 7 produits (savons, laits, huiles, shampoings)
- **Hôtel & Spa** : 3 produits (coffrets, distributeurs)

---

### Table `pharmacies`

Clients (pharmacies) et prospects.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `name` | TEXT | Nom de la pharmacie |
| `address` | TEXT | Adresse complète |
| `postal_code` | TEXT | Code postal |
| `city` | TEXT | Ville |
| `phone` | TEXT | Téléphone |
| `email` | TEXT | Email de contact |
| `sector` | TEXT | Secteur géographique |
| `status` | TEXT | 'actif', 'inactif', 'prospect' |
| `assigned_commercial_id` | UUID | Commercial assigné (FK users) |
| `first_contact_date` | DATE | Date du premier contact |
| `notes` | TEXT | Notes générales |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Dernière mise à jour |

**Index :** `idx_pharmacies_commercial`, `idx_pharmacies_sector`, `idx_pharmacies_status`, `idx_pharmacies_city`

---

### Table `pharmacy_notes`

Historique des notes et interactions avec les pharmacies.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `pharmacy_id` | UUID | Référence à pharmacies |
| `user_id` | UUID | Auteur de la note (FK users) |
| `note_text` | TEXT | Contenu de la note |
| `created_at` | TIMESTAMPTZ | Date de création |

**Index :** `idx_pharmacy_notes_pharmacy`, `idx_pharmacy_notes_user`, `idx_pharmacy_notes_created`

---

### Table `orders`

Commandes effectuées par les commerciaux.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `order_number` | TEXT | Numéro unique (ex: 'OL-20250101-0001') |
| `pharmacy_id` | UUID | Pharmacie cliente (FK pharmacies) |
| `commercial_id` | UUID | Commercial créateur (FK users) |
| `order_date` | TIMESTAMPTZ | Date de la commande |
| `status` | TEXT | 'en_attente', 'validée', 'expédiée', 'livrée', 'annulée' |
| `total_amount` | DECIMAL(10,2) | Montant total TTC |
| `notes` | TEXT | Notes sur la commande |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Dernière mise à jour |

**Index :** `idx_orders_pharmacy`, `idx_orders_commercial`, `idx_orders_date`, `idx_orders_status`, `idx_orders_number`

---

### Table `order_lines`

Lignes de détail des commandes (produits commandés).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `order_id` | UUID | Référence à orders |
| `product_id` | UUID | Référence à products |
| `product_name` | TEXT | Nom du produit (copie) |
| `product_sku` | TEXT | SKU du produit (copie) |
| `quantity` | INTEGER | Quantité commandée |
| `unit_price` | DECIMAL(10,2) | Prix unitaire à la commande |
| `line_total` | DECIMAL(10,2) | Total de la ligne |
| `created_at` | TIMESTAMPTZ | Date de création |

**Index :** `idx_order_lines_order`, `idx_order_lines_product`

---

### Table `email_logs`

Historique des emails envoyés par le système.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `order_id` | UUID | Commande associée (FK orders) |
| `recipient` | TEXT | Destinataire de l'email |
| `email_type` | TEXT | 'order_confirmation', 'admin_notification' |
| `subject` | TEXT | Sujet de l'email |
| `status` | TEXT | 'sent', 'failed', 'pending' |
| `sent_at` | TIMESTAMPTZ | Date d'envoi |
| `error_message` | TEXT | Message d'erreur si échec |
| `created_at` | TIMESTAMPTZ | Date de création |

**Index :** `idx_email_logs_order`, `idx_email_logs_status`, `idx_email_logs_sent_at`, `idx_email_logs_type`

---

## 🔒 Row Level Security (RLS)

Toutes les tables ont RLS activé avec des policies spécifiques :

### Règles générales

- **Commerciaux** : Accès uniquement à leurs données (pharmacies assignées, leurs commandes)
- **Admins** : Accès complet à toutes les données
- **Produits** : Lecture pour tous les utilisateurs authentifiés
- **Email logs** : Accès admin uniquement

### Exemples de policies

```sql
-- Les commerciaux voient leurs pharmacies
CREATE POLICY "commercials_view_own_pharmacies"
  ON pharmacies FOR SELECT
  USING (
    assigned_commercial_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Les commerciaux créent leurs commandes
CREATE POLICY "commercials_create_orders"
  ON orders FOR INSERT
  WITH CHECK (commercial_id = auth.uid());
```

---

## 🔧 Fonctions Utilitaires

### `generate_order_number()`

Génère automatiquement un numéro de commande unique au format `OL-YYYYMMDD-XXXX`.

```sql
SELECT generate_order_number();
-- Retourne: 'OL-20250101-0001'
```

### `update_updated_at_column()`

Trigger automatique qui met à jour le champ `updated_at` lors d'un UPDATE.

---

## 📈 Requêtes Utiles

### Statistiques des produits par catégorie

```sql
SELECT
  category,
  COUNT(*) as nombre_produits,
  SUM(stock_quantity) as stock_total,
  AVG(pcb_price) as prix_moyen
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY category;
```

### Commandes du mois en cours

```sql
SELECT
  o.order_number,
  o.order_date,
  p.name as pharmacie,
  u.full_name as commercial,
  o.total_amount,
  o.status
FROM orders o
LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
LEFT JOIN users u ON o.commercial_id = u.id
WHERE DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY o.order_date DESC;
```

### Top 10 des produits les plus vendus

```sql
SELECT
  p.name,
  p.sku,
  SUM(ol.quantity) as total_vendu,
  COUNT(DISTINCT ol.order_id) as nombre_commandes
FROM order_lines ol
JOIN products p ON ol.product_id = p.id
GROUP BY p.id, p.name, p.sku
ORDER BY total_vendu DESC
LIMIT 10;
```

### Performance par commercial

```sql
SELECT
  u.full_name,
  COUNT(o.id) as nombre_commandes,
  SUM(o.total_amount) as chiffre_affaires,
  COUNT(DISTINCT o.pharmacy_id) as nombre_clients
FROM users u
LEFT JOIN orders o ON u.id = o.commercial_id
WHERE u.role = 'commercial'
GROUP BY u.id, u.full_name
ORDER BY chiffre_affaires DESC;
```

---

## 🔄 Maintenance

### Backup de la base de données

Via Supabase Dashboard :
1. **Settings** → **Database**
2. **Backups** → **Create Backup**

Via Supabase CLI :
```bash
supabase db dump -f backup.sql
```

### Restaurer un backup

```bash
supabase db reset
supabase db push
psql -h db.xxx.supabase.co -U postgres -d postgres -f backup.sql
```

### Nettoyer les anciennes données

```sql
-- Supprimer les logs d'emails de plus de 90 jours
DELETE FROM email_logs
WHERE created_at < NOW() - INTERVAL '90 days';

-- Archiver les commandes de plus d'un an
-- (À adapter selon vos besoins)
```

---

## 🐛 Dépannage

### Problème : Impossible de créer une commande

**Cause** : Vérifier les policies RLS et que l'utilisateur est bien authentifié.

```sql
-- Vérifier l'utilisateur actuel
SELECT auth.uid(), auth.email();

-- Vérifier les permissions sur orders
SELECT * FROM pg_policies WHERE tablename = 'orders';
```

### Problème : Produits non visibles

**Cause** : RLS activé mais policies manquantes.

```sql
-- Vérifier les policies sur products
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Temporairement désactiver RLS pour debug (ATTENTION : uniquement en dev)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

### Problème : Performances lentes

**Cause** : Index manquants ou requêtes non optimisées.

```sql
-- Analyser les requêtes lentes
SELECT * FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Vérifier les index
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📝 Notes Importantes

1. **Ne jamais désactiver RLS en production** - La sécurité des données dépend de RLS
2. **Backups réguliers** - Configurer des backups automatiques quotidiens
3. **Monitoring** - Surveiller les performances et les logs d'erreur
4. **Migrations** - Toujours tester les migrations en dev avant prod
5. **Service Role Key** - Ne jamais exposer cette clé côté client

---

## 🤝 Support

Pour toute question sur la base de données :
- Consulter ce README
- Vérifier les commentaires dans les fichiers SQL
- Contacter l'équipe de développement

---

**Dernière mise à jour** : 2025-01-01
**Version** : 1.0.0
