# 🚀 Guide d'Installation Complet - L'Olivier de Leos

## 📋 Vue d'ensemble

Ce guide vous accompagne étape par étape pour installer et configurer l'application complète de gestion de commandes L'Olivier de Leos avec le système d'emails automatiques.

---

## ⚙️ Prérequis

- Node.js 18+ installé
- npm ou yarn
- Compte Supabase (gratuit)
- Compte Gmail avec mot de passe d'application

---

## 📦 Étape 1 : Installation des Dépendances

```bash
cd olivier-leos-app
npm install
```

**Dépendances principales installées:**
- Next.js 14
- React 18
- TypeScript
- Supabase Client
- Tailwind CSS
- Nodemailer (emails)
- Lucide React (icônes)

---

## 🗄️ Étape 2 : Configuration Supabase

### 2.1 Créer les Tables

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Copiez tout le contenu du fichier `supabase-schema.sql`
5. Collez-le dans l'éditeur SQL
6. Cliquez sur **Run** (ou Ctrl+Enter)

**✅ Ce qui sera créé:**
- ✅ Table `users` (commerciaux et admins)
- ✅ Table `products` (catalogue produits)
- ✅ Table `pharmacies` (clients)
- ✅ Table `pharmacy_notes` (notes de visite)
- ✅ Table `orders` (commandes)
- ✅ Table `order_lines` (lignes de commande)
- ✅ Table `email_logs` (logs d'envoi d'emails)
- ✅ Tous les index pour les performances
- ✅ Row Level Security (RLS) activée
- ✅ Toutes les policies de sécurité
- ✅ Données de test (5 produits exemple)

### 2.2 Vérifier les Tables

```sql
-- Dans SQL Editor, exécutez:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Vous devriez voir:**
- email_logs
- order_lines
- orders
- pharmacies
- pharmacy_notes
- products
- users

### 2.3 Récupérer les Clés API

1. Allez dans **Settings** → **API**
2. Copiez les informations suivantes:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (clé publique)
   - **service_role**: `eyJhbGc...` (clé secrète, NE PAS EXPOSER!)

---

## 🔐 Étape 3 : Configuration des Variables d'Environnement

Le fichier `.env.local` existe déjà et contient:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yeotvzajxwejiohmlvdr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inllb3R2emFqeHdlamlvaG1sdmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1ODU2NDksImV4cCI6MjA3NzE2MTY0OX0.CdIykB2lCFct-gS-rxgknLQxFbFo_5mRKcmtSWzMnqI

# Configuration SMTP Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@pharmaliftsolutions.com
SMTP_PASSWORD=buej vvsa baag uoos
ADMIN_EMAIL=philippe.levy@mac.com
```

### ⚠️ À COMPLÉTER:

Ajoutez la **Service Role Key** (ligne à décommenter):

```env
# Service Role Key - À RÉCUPÉRER depuis Supabase Dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key-ici
```

**Important:** Cette clé contourne toutes les règles RLS. Ne JAMAIS l'exposer côté client!

---

## 👤 Étape 4 : Créer le Compte Administrateur

Une fois la Service Role Key ajoutée dans `.env.local`:

```bash
npm run create-admin
```

**Résultat attendu:**
```
🚀 Création du compte administrateur...

Étape 1/2 : Création dans Supabase Auth...
✅ Utilisateur créé dans Supabase Auth

Étape 2/2 : Insertion dans la table users...
✅ Utilisateur créé dans la table users

✅ SUCCÈS: Compte admin créé avec succès pour philippe.levy@mac.com

📧 Email: philippe.levy@mac.com
🔑 Password: OlivierLeos2025!Secure
👤 Nom: Philippe Levy
👑 Role: admin
📍 Secteur: PACA

💡 Vous pouvez maintenant vous connecter sur /login
```

**Identifiants du compte admin:**
- 📧 Email: **philippe.levy@mac.com**
- 🔑 Mot de passe: **OlivierLeos2025!Secure**

---

## 🚀 Étape 5 : Lancer l'Application

```bash
npm run dev
```

**L'application démarre sur:** http://localhost:3000

---

## 🧪 Étape 6 : Tester le Système d'Emails

### Test 1: Configuration SMTP

1. Ouvrez votre navigateur
2. Allez sur: http://localhost:3000/api/test-email
3. Vérifiez le résultat JSON:

```json
{
  "success": true,
  "message": "Email de test envoyé avec succès",
  "messageId": "<xxxxx@smtp.gmail.com>",
  "recipient": "philippe.levy@mac.com"
}
```

4. Vérifiez la boîte mail **philippe.levy@mac.com**
5. Vous devriez recevoir un email de test avec:
   - Expéditeur: L'Olivier de Leos <info@pharmaliftsolutions.com>
   - Sujet: Test Email - L'Olivier de Leos
   - Design professionnel vert olive

**✅ Si vous recevez l'email:** La configuration SMTP fonctionne!

**❌ Si vous ne recevez pas l'email:**
- Vérifiez les variables SMTP dans `.env.local`
- Vérifiez les logs serveur (terminal)
- Vérifiez le dossier spam

### Test 2: Connexion Admin

1. Allez sur: http://localhost:3000/login
2. Connectez-vous avec:
   - Email: `philippe.levy@mac.com`
   - Password: `OlivierLeos2025!Secure`
3. Vous devriez être redirigé vers le dashboard (`/`)
4. Vérifiez que vous voyez "Administration" dans la sidebar
5. Cliquez sur "Administration" → Vous accédez à `/admin`

**✅ Interface Admin affiche:**
- Statistiques du mois (CA, commandes, commerciaux)
- Tableau de gestion des utilisateurs
- Bouton "Exporter CSV"
- Dernières commandes

### Test 3: Créer un Compte Commercial

1. Déconnectez-vous
2. Allez sur: http://localhost:3000/signup
3. Remplissez le formulaire:
   - Email: `commercial1@test.com`
   - Mot de passe: `Test1234!`
   - Confirmer mot de passe: `Test1234!`
   - Nom complet: `Jean Dupont`
   - Secteur: `Alpes-Maritimes`
4. Cliquez sur "Créer mon compte"
5. Vous êtes redirigé vers `/login` avec un message de succès
6. Connectez-vous avec les identifiants créés
7. Vérifiez que "Administration" n'apparaît PAS dans la sidebar (normal, vous êtes commercial)

### Test 4: Créer une Pharmacie (en tant qu'Admin)

1. Connectez-vous en tant qu'admin
2. Pour l'instant, les pharmacies doivent être créées manuellement dans Supabase

**Via SQL Editor:**
```sql
INSERT INTO pharmacies (
  name,
  address,
  postal_code,
  city,
  phone,
  email,
  sector,
  status,
  assigned_commercial_id
) VALUES (
  'Pharmacie Centrale',
  '15 Avenue de la République',
  '06000',
  'Nice',
  '04 93 88 88 88',
  'contact@pharmacie-centrale.com',
  'Alpes-Maritimes',
  'actif',
  (SELECT id FROM users WHERE email = 'commercial1@test.com')
);
```

### Test 5: Créer une Commande avec Emails Automatiques

1. Connectez-vous en tant que commercial (`commercial1@test.com`)
2. Allez sur: http://localhost:3000/orders/new
3. **Étape 1:** Sélectionnez la pharmacie créée
4. **Étape 2:** Ajoutez des produits au panier
   - Cherchez "Crème" ou "Savon"
   - Cliquez sur "Ajouter" pour chaque produit
   - Modifiez les quantités si besoin
5. **Étape 3:** Vérifiez le récapitulatif
   - Ajoutez une note (optionnel): "Commande de test"
   - Cliquez sur "Valider la commande"

**✅ Résultat attendu:**
- Message: "Commande créée avec succès! Les emails de confirmation sont en cours d'envoi."
- Redirection vers `/orders`
- La commande apparaît dans l'historique

**📧 Vérifiez les emails:**

1. **Email à la pharmacie** (`contact@pharmacie-centrale.com`):
   - Expéditeur: L'Olivier de Leos <info@pharmaliftsolutions.com>
   - Sujet: Confirmation de commande CMD-xxx - L'Olivier de Leos
   - Contenu:
     - Tableau détaillé des produits
     - Total HT, TVA, TTC
     - Coordonnées de contact

2. **Email à l'admin** (`philippe.levy@mac.com`):
   - Expéditeur: L'Olivier de Leos <info@pharmaliftsolutions.com>
   - Sujet: Nouvelle commande CMD-xxx - Pharmacie Centrale
   - Contenu:
     - Résumé de la commande
     - Bouton "Voir dans l'interface admin"

### Test 6: Vérifier les Logs d'Emails

**Via Supabase SQL Editor:**

```sql
-- Voir tous les emails envoyés
SELECT
  id,
  recipient,
  email_type,
  subject,
  status,
  sent_at,
  error_message
FROM email_logs
ORDER BY sent_at DESC
LIMIT 10;
```

**Résultat attendu:**
```
| recipient                        | email_type          | status | sent_at             |
|----------------------------------|---------------------|--------|---------------------|
| contact@pharmacie-centrale.com   | order_confirmation  | sent   | 2025-01-15 14:30:00 |
| philippe.levy@mac.com            | admin_notification  | sent   | 2025-01-15 14:30:01 |
```

---

## 📊 Étape 7: Explorer l'Application

### Dashboard Commercial (`/`)
- Statistiques du mois en cours
- Dernières pharmacies visitées
- Commandes récentes
- Liens rapides

### Catalogue Produits (`/products`)
- Liste de tous les produits
- Filtres par catégorie
- Recherche par nom/SKU
- Prix PCB et public

### Mes Pharmacies (`/pharmacies`)
- Liste des pharmacies assignées
- Recherche par nom/ville
- Filtre par statut
- Lien vers détails

### Détails Pharmacie (`/pharmacies/[id]`)
- Informations complètes
- Historique des commandes
- Notes de visite
- Bouton "Créer une commande"

### Nouvelle Commande (`/orders/new`)
- 3 étapes:
  1. Sélection pharmacie
  2. Ajout produits
  3. Récapitulatif et validation
- Envoi emails automatique

### Historique Commandes (`/orders`)
- Toutes les commandes du commercial
- Filtres par statut et date
- Détails de chaque commande

### Administration (`/admin`) - Réservé aux Admins
- Statistiques globales
- CA et commandes du mois
- Gestion des utilisateurs:
  - Voir tous les commerciaux
  - Changer les rôles (commercial ↔ admin)
  - Statistiques par utilisateur
- Export CSV complet
- Dernières commandes (toutes)

---

## 🔒 Sécurité

### Variables d'environnement
- ✅ `.env.local` est dans `.gitignore`
- ✅ Ne JAMAIS commiter les credentials
- ✅ Service Role Key utilisée UNIQUEMENT côté serveur

### Row Level Security (RLS)
- ✅ Activée sur toutes les tables
- ✅ Commerciaux ne voient que leurs pharmacies
- ✅ Commerciaux ne voient que leurs commandes
- ✅ Admins voient tout
- ✅ Email logs accessibles uniquement aux admins

### Middleware
- ✅ Protection de toutes les routes
- ✅ Vérification authentification
- ✅ Vérification rôle admin pour `/admin`
- ✅ Redirection automatique si non autorisé

---

## 📁 Structure du Projet

```
olivier-leos-app/
├── app/
│   ├── page.tsx                    # Dashboard commercial
│   ├── login/page.tsx              # Connexion
│   ├── signup/page.tsx             # Inscription
│   ├── products/page.tsx           # Catalogue produits
│   ├── pharmacies/
│   │   ├── page.tsx                # Liste pharmacies
│   │   └── [id]/page.tsx           # Détails pharmacie
│   ├── orders/
│   │   ├── page.tsx                # Historique commandes
│   │   └── new/page.tsx            # Nouvelle commande
│   ├── admin/page.tsx              # Dashboard admin
│   └── api/
│       ├── test-email/route.ts     # Test SMTP
│       └── send-order-emails/route.ts  # Envoi emails commande
├── components/
│   ├── Header.tsx                  # En-tête
│   ├── Sidebar.tsx                 # Menu latéral
│   ├── Footer.tsx                  # Pied de page
│   └── AppLayout.tsx               # Layout global
├── lib/
│   ├── email.ts                    # Core email (Nodemailer)
│   ├── email-templates/
│   │   ├── order-confirmation.ts   # Template pharmacie
│   │   └── admin-notification.ts   # Template admin
│   └── supabase/
│       ├── client.ts               # Client Supabase (browser)
│       └── server.ts               # Client Supabase (serveur)
├── types/
│   └── database.types.ts           # Types TypeScript
├── scripts/
│   └── create-admin.ts             # Script création admin
├── middleware.ts                   # Protection routes
├── supabase-schema.sql             # Schéma complet base de données
├── .env.local                      # Variables d'environnement
├── package.json                    # Dépendances
└── README.md                       # Documentation
```

---

## 🐛 Dépannage

### Erreur "User already exists" lors de la création admin

```bash
# Le script détecte automatiquement et met à jour le rôle
npm run create-admin
```

### Erreur "SUPABASE_SERVICE_ROLE_KEY is missing"

1. Allez sur Supabase Dashboard → Settings → API
2. Copiez la **service_role** key
3. Ajoutez-la dans `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=votre-clé-ici
   ```
4. Relancez le script

### Erreur SMTP "Invalid login"

1. Vérifiez que vous utilisez un **mot de passe d'application** Gmail
2. Allez sur: https://myaccount.google.com/apppasswords
3. Créez un nouveau mot de passe d'application
4. Mettez-le à jour dans `.env.local`:
   ```env
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### Emails non reçus

1. Vérifiez les logs serveur (terminal)
2. Vérifiez la table `email_logs` dans Supabase
3. Vérifiez le dossier spam
4. Testez avec `/api/test-email`

### Route `/admin` redirige vers `/`

1. Vérifiez que vous êtes connecté avec le bon compte
2. Vérifiez le rôle dans Supabase:
   ```sql
   SELECT email, role FROM users WHERE email = 'philippe.levy@mac.com';
   ```
3. Si le rôle n'est pas 'admin', mettez-le à jour:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'philippe.levy@mac.com';
   ```

---

## 📈 Prochaines Étapes

### Ajouter des Pharmacies

Créez vos pharmacies dans Supabase SQL Editor:

```sql
INSERT INTO pharmacies (name, address, postal_code, city, phone, email, sector, status, assigned_commercial_id)
VALUES
  ('Pharmacie du Centre', '5 Place de la Mairie', '06100', 'Nice', '04 93 00 00 00', 'centre@pharmacy.com', 'Alpes-Maritimes', 'actif',
   (SELECT id FROM users WHERE role = 'commercial' LIMIT 1)),

  ('Pharmacie de la Gare', '20 Avenue de la Gare', '83000', 'Toulon', '04 94 00 00 00', 'gare@pharmacy.com', 'Var', 'actif',
   (SELECT id FROM users WHERE role = 'commercial' LIMIT 1));
```

### Ajouter des Produits

Le fichier SQL contient déjà 5 produits de test. Pour en ajouter:

```sql
INSERT INTO products (sku, name, category, description, pcb_price, retail_price, stock_quantity)
VALUES ('OL-XX-XXX', 'Nom Produit', 'Soins Visage', 'Description', 25.00, 38.00, 100);
```

### Créer des Commerciaux Supplémentaires

Utilisez la page `/signup` ou via Supabase:

```sql
-- D'abord créer l'utilisateur dans Auth (via interface Supabase Auth)
-- Puis:
INSERT INTO users (id, email, full_name, role, sector)
VALUES ('uuid-from-auth', 'commercial2@example.com', 'Marie Martin', 'commercial', 'Bouches-du-Rhône');
```

---

## 🚀 Déploiement sur Vercel

### 1. Push sur GitHub

```bash
git init
git add .
git commit -m "Initial commit - L'Olivier de Leos"
git remote add origin https://github.com/votre-username/olivier-leos-app.git
git push -u origin main
```

### 2. Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Import Project"
3. Sélectionnez votre repo GitHub
4. Configurez les variables d'environnement:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yeotvzajxwejiohmlvdr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@pharmaliftsolutions.com
SMTP_PASSWORD=buej vvsa baag uoos
ADMIN_EMAIL=philippe.levy@mac.com
```

5. Cliquez sur "Deploy"

### 3. Tester en Production

- Testez la connexion
- Testez la création de commande
- Vérifiez que les emails sont envoyés
- Vérifiez les logs dans Supabase

---

## ✅ Checklist Finale

- [ ] Node.js installé
- [ ] Dépendances installées (`npm install`)
- [ ] Tables Supabase créées (SQL exécuté)
- [ ] Variables `.env.local` configurées
- [ ] Service Role Key ajoutée
- [ ] Compte admin créé (`npm run create-admin`)
- [ ] Application démarrée (`npm run dev`)
- [ ] Test SMTP réussi (`/api/test-email`)
- [ ] Connexion admin fonctionnelle
- [ ] Compte commercial créé
- [ ] Pharmacie créée (SQL)
- [ ] Commande de test créée
- [ ] Emails reçus (pharmacie + admin)
- [ ] Logs email vérifiés dans Supabase

---

## 📞 Support

Pour toute question ou problème:

1. Consultez les fichiers de documentation:
   - `INSTRUCTIONS_ADMIN.md` - Guide admin
   - `RAPPORT_AMELIORATIONS.md` - Améliorations apportées
   - `RAPPORT_EMAIL_SYSTEM.md` - Système d'emails détaillé
   - `GUIDE_INSTALLATION.md` - Ce guide

2. Vérifiez les logs serveur (terminal)

3. Vérifiez les logs dans Supabase:
   ```sql
   SELECT * FROM email_logs WHERE status = 'failed';
   ```

---

**🎉 Félicitations ! Votre application L'Olivier de Leos est maintenant opérationnelle !**
