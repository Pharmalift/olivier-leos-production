/**
 * Script pour créer le compte administrateur
 *
 * Ce script crée un utilisateur admin avec :
 * - Email: philippe.levy@mac.com
 * - Password: OlivierLeos2025!Secure
 * - Role: admin
 *
 * IMPORTANT: Ce script doit être exécuté côté serveur avec le Service Role Key
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  console.error('❌ ERREUR: La variable d\'environnement SUPABASE_SERVICE_ROLE_KEY est manquante')
  console.log('Ajoutez-la dans votre fichier .env.local :')
  console.log('SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key')
  process.exit(1)
}

// Créer un client Supabase avec le Service Role Key (contourne RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminAccount() {
  const adminData = {
    email: 'philippe.levy@mac.com',
    password: 'OlivierLeos2025!Secure',
    full_name: 'Philippe Levy',
    role: 'admin',
    sector: 'PACA'
  }

  console.log('\n🚀 Création du compte administrateur...\n')

  try {
    // 1. Créer l'utilisateur dans Supabase Auth
    console.log('Étape 1/2 : Création dans Supabase Auth...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        full_name: adminData.full_name
      }
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.code === 'email_exists') {
        console.log('ℹ️  L\'utilisateur existe déjà dans Auth')

        // Récupérer l'utilisateur existant
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        if (listError) throw listError

        const existingUser = users?.find(u => u.email === adminData.email)

        if (!existingUser) {
          throw new Error('Utilisateur introuvable')
        }

        // 2. Vérifier/Mettre à jour l'entrée dans la table users
        console.log('Étape 2/2 : Vérification de la table users...')

        const { data: userData, error: userSelectError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', existingUser.id)
          .single()

        if (userSelectError && userSelectError.code !== 'PGRST116') {
          throw userSelectError
        }

        if (!userData) {
          // Créer l'entrée si elle n'existe pas
          const { error: userInsertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: existingUser.id,
              email: adminData.email,
              full_name: adminData.full_name,
              role: adminData.role,
              sector: adminData.sector
            })

          if (userInsertError) throw userInsertError

          console.log('✅ Entrée créée dans la table users')
        } else if (userData.role !== 'admin') {
          // Mettre à jour le rôle si nécessaire
          const { error: userUpdateError } = await supabaseAdmin
            .from('users')
            .update({ role: 'admin' })
            .eq('id', existingUser.id)

          if (userUpdateError) throw userUpdateError

          console.log('✅ Rôle mis à jour en admin')
        } else {
          console.log('✅ L\'utilisateur est déjà admin')
        }

        console.log('\n✅ SUCCÈS: Compte admin configuré')
        console.log('\n📧 Email:', adminData.email)
        console.log('🔑 Password:', adminData.password)
        console.log('👑 Role: admin')
        console.log('\n💡 Vous pouvez maintenant vous connecter sur /login\n')

        return
      }

      throw authError
    }

    if (!authData.user) {
      throw new Error('Erreur lors de la création du compte')
    }

    console.log('✅ Utilisateur créé dans Supabase Auth')

    // 2. Créer l'entrée dans la table users
    console.log('Étape 2/2 : Insertion dans la table users...')
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminData.email,
        full_name: adminData.full_name,
        role: adminData.role,
        sector: adminData.sector
      })

    if (userError) {
      console.error('❌ Erreur lors de l\'insertion dans users:', userError)

      // Nettoyer : supprimer l'utilisateur Auth si l'insertion dans users échoue
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      throw userError
    }

    console.log('✅ Utilisateur créé dans la table users')

    console.log('\n✅ SUCCÈS: Compte admin créé avec succès pour philippe.levy@mac.com')
    console.log('\n📧 Email:', adminData.email)
    console.log('🔑 Password:', adminData.password)
    console.log('👤 Nom:', adminData.full_name)
    console.log('👑 Role: admin')
    console.log('📍 Secteur:', adminData.sector)
    console.log('\n💡 Vous pouvez maintenant vous connecter sur /login\n')

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message)
    if (error.code !== 'email_exists') {
      console.error('\nDétails:', error)
    }
    process.exit(1)
  }
}

// Exécuter le script
createAdminAccount()
