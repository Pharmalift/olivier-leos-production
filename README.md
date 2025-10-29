# L'Olivier de Leos - Application de Prise de Commande

Application complète de gestion des commandes pour L'Olivier de Leos, développée avec Next.js 14, TypeScript, Supabase et Tailwind CSS.

## 🌿 Présentation

Application professionnelle pour les commerciaux de L'Olivier de Leos permettant de :
- Gérer les pharmacies clientes
- Consulter le catalogue de 19 produits
- Créer des commandes en 3 étapes
- Suivre l'historique des commandes
- Visualiser des statistiques de performance

## 🛠️ Technologies utilisées

- **Next.js 14** - App Router et Server Components
- **TypeScript** - Typage statique
- **Supabase** - Authentification et base de données
- **Tailwind CSS** - Design moderne
- **Lucide React** - Icônes
- **@supabase/auth-helpers-nextjs** - Gestion auth

## 📁 Structure du projet

```
olivier-leos-app/
├── app/
│   ├── page.tsx                    # Dashboard commercial
│   ├── login/page.tsx              # Authentification
│   ├── products/page.tsx           # Catalogue produits
│   ├── pharmacies/
│   │   ├── page.tsx               # Liste pharmacies
│   │   └── [id]/page.tsx          # Détails pharmacie
│   ├── orders/
│   │   ├── page.tsx               # Historique commandes
│   │   └── new/page.tsx           # Formulaire commande (3 étapes)
│   └── admin/page.tsx             # Dashboard admin
├── components/
│   ├── AppLayout.tsx              # Layout avec sidebar
│   ├── Header.tsx                 # En-tête
│   ├── Sidebar.tsx                # Navigation latérale
│   └── Footer.tsx
├── lib/supabase/
│   ├── client.ts                  # Client Supabase (client-side)
│   └── server.ts                  # Client Supabase (server-side)
├── types/
│   └── database.types.ts          # Types TypeScript
└── middleware.ts                  # Protection des routes
```

## 🗄️ Base de données Supabase

### Tables requises

```sql
-- Users (commerciaux et admins)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('commercial', 'admin')) NOT NULL,
  sector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (catalogue L'Olivier)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('Soins Visage', 'Soins Corps & Cheveux', 'Hôtel & Spa')),
  description TEXT,
  pcb_price DECIMAL(10,2) NOT NULL,
  retail_price DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Pharmacies
CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  sector TEXT NOT NULL,
  status TEXT CHECK (status IN ('actif', 'inactif', 'prospect')) DEFAULT 'prospect',
  assigned_commercial_id UUID REFERENCES users(id),
  first_contact_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy Notes
CREATE TABLE pharmacy_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  pharmacy_id UUID REFERENCES pharmacies(id),
  commercial_id UUID REFERENCES users(id),
  order_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('en_attente', 'validée', 'expédiée', 'livrée', 'annulée')) DEFAULT 'en_attente',
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT
);

-- Order Lines
CREATE TABLE order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL
);
```

## 🚀 Installation et démarrage

### 1. Cloner et installer

```bash
cd olivier-leos-app
npm install
```

### 2. Configuration Supabase

Le fichier `.env.local` est déjà configuré avec vos identifiants :

```env
NEXT_PUBLIC_SUPABASE_URL=https://yeotvzajxwejiohmlvdr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Créer les tables dans Supabase

1. Allez sur [votre projet Supabase](https://supabase.com/dashboard/project/yeotvzajxwejiohmlvdr)
2. SQL Editor → Nouvelle requête
3. Copiez-collez les requêtes SQL ci-dessus
4. Exécutez

### 4. Lancer l'application

```bash
npm run dev
```

Accédez à [http://localhost:3000](http://localhost:3000)

## 📱 Fonctionnalités

### Pour les commerciaux
- ✅ **Dashboard** : Statistiques personnelles (commandes, CA du mois)
- ✅ **Catalogue produits** : 19 produits avec filtres par catégorie et recherche
- ✅ **Gestion pharmacies** : Liste, détails, historique, notes de visite
- ✅ **Création commande** : Formulaire en 3 étapes (pharmacie → produits → validation)
- ✅ **Historique commandes** : Filtres par date, statut, pharmacie

### Pour les admins
- ✅ **Dashboard admin** : Statistiques globales
- ✅ **Performance commerciaux** : Classement et métriques
- ✅ **Toutes les commandes** : Vue complète
- ✅ **Export Excel/CSV** : Export des données

### Sécurité
- 🔒 Middleware Next.js pour protéger toutes les routes
- 🔒 Authentification Supabase Auth
- 🔒 RLS (Row Level Security) Supabase
- 🔒 Accès admin restreint pour `/admin`

## 🎨 Design

- **Couleurs** : Vert olive (#6B8E23) et blanc cassé (#F5F5DC)
- **Responsive** : Mobile-first design
- **UX** : Navigation intuitive avec sidebar
- **Icônes** : Lucide React

## 📄 Pages

| Route | Description | Accès |
|-------|-------------|-------|
| `/` | Dashboard commercial | Commercial + Admin |
| `/login` | Connexion | Public |
| `/products` | Catalogue produits | Commercial + Admin |
| `/pharmacies` | Liste pharmacies | Commercial + Admin |
| `/pharmacies/[id]` | Détails pharmacie | Commercial + Admin |
| `/orders/new` | Nouvelle commande | Commercial + Admin |
| `/orders` | Historique commandes | Commercial + Admin |
| `/admin` | Dashboard administrateur | Admin uniquement |

## 🔑 Comptes de test

Créez des utilisateurs dans Supabase Auth puis ajoutez-les dans la table `users` :

```sql
-- Admin
INSERT INTO users (id, email, full_name, role, sector)
VALUES ('uuid-auth-user', 'admin@lolivier.com', 'Admin', 'admin', NULL);

-- Commercial
INSERT INTO users (id, email, full_name, role, sector)
VALUES ('uuid-auth-user', 'commercial@lolivier.com', 'Jean Dupont', 'commercial', 'Ile-de-France');
```

## 🚢 Déploiement

### Vercel (recommandé)

```bash
npm install -g vercel
vercel
```

Configurez les variables d'environnement dans le dashboard Vercel.

## 📞 Support

Pour toute question sur l'application, consultez la documentation Supabase et Next.js.
