# 🔐 Instructions pour créer le compte administrateur

## Étape 1 : Récupérer la Service Role Key

1. Allez sur votre [Dashboard Supabase](https://supabase.com/dashboard/project/yeotvzajxwejiohmlvdr)
2. Cliquez sur **Settings** (icône ⚙️ dans le menu de gauche)
3. Cliquez sur **API**
4. Copiez la clé **service_role** (sous "Project API keys")
   - ⚠️ **ATTENTION** : Cette clé contourne toutes les règles RLS ! Ne JAMAIS l'exposer côté client !

## Étape 2 : Configurer la clé dans .env.local

Éditez le fichier `.env.local` et décommentez/ajoutez la ligne :

```env
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key-copiée
```

Le fichier `.env.local` devrait ressembler à :

```env
NEXT_PUBLIC_SUPABASE_URL=https://yeotvzajxwejiohmlvdr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (votre clé ici)
```

## Étape 3 : Créer le compte admin

Exécutez le script de création :

```bash
npm run create-admin
```

Le script va créer automatiquement :
- Un utilisateur dans Supabase Auth
- Une entrée dans la table `users` avec `role='admin'`

### Informations du compte créé :

```
📧 Email: philippe.levy@mac.com
🔑 Password: OlivierLeos2025!Secure
👑 Role: admin
📍 Secteur: PACA
```

## Étape 4 : Se connecter

1. Allez sur http://localhost:3000/login
2. Connectez-vous avec les identifiants ci-dessus
3. Vous aurez accès à toutes les fonctionnalités admin !

## Que faire si le script échoue ?

### Erreur "User already exists"

Le script détecte automatiquement si l'utilisateur existe et met à jour son rôle en `admin` si nécessaire. Relancez simplement le script.

### Erreur "SUPABASE_SERVICE_ROLE_KEY is missing"

Vérifiez que vous avez bien ajouté la clé dans `.env.local`.

### Autres erreurs

1. Vérifiez que les tables Supabase sont bien créées (exécutez `supabase-schema.sql`)
2. Vérifiez que la Service Role Key est valide
3. Consultez les logs d'erreur pour plus de détails

## Sécurité

⚠️ **IMPORTANT** :
- Ne commitez JAMAIS le fichier `.env.local` dans Git (il est déjà dans `.gitignore`)
- Ne partagez JAMAIS votre Service Role Key
- Utilisez cette clé UNIQUEMENT côté serveur (scripts, API routes)
- Ne l'utilisez JAMAIS dans du code client

## Fonctionnalités Admin

Une fois connecté en tant qu'admin, vous aurez accès à :

- 📊 **Statistiques globales** : CA du mois, nombre de commandes, commerciaux actifs
- 👥 **Gestion des utilisateurs** : Liste de tous les utilisateurs avec leurs stats
- 🔄 **Changement de rôle** : Bouton pour passer un utilisateur de commercial à admin (et vice-versa)
- 📥 **Export CSV** : Exporter toutes les commandes au format CSV
- 📦 **Toutes les commandes** : Vue complète de toutes les commandes (pas seulement les siennes)

## Changer le rôle d'un utilisateur

1. Connectez-vous en tant qu'admin
2. Allez sur `/admin`
3. Dans le tableau "Gestion des utilisateurs", cliquez sur le bouton "Admin" ou "Commercial" pour changer le rôle
4. Confirmez le changement

⚠️ Vous ne pouvez pas changer votre propre rôle.
