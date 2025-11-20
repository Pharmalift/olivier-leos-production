/**
 * Script pour appliquer la migration RLS directement via l'API Supabase
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  console.error('❌ ERREUR: La variable d\'environnement SUPABASE_SERVICE_ROLE_KEY est manquante')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

async function applyMigration() {
  console.log('\n🚀 Application de la migration RLS pour users...\n')

  try {
    // On va utiliser l'API REST de Supabase pour exécuter le SQL
    const migrationSQL = `
      CREATE POLICY "service_role_insert_users"
        ON users FOR INSERT
        WITH CHECK (true);
    `

    console.log('📄 SQL à exécuter:')
    console.log(migrationSQL)
    console.log('\n⏳ Exécution via fetch...')

    // Utiliser l'API REST de Supabase directement
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.log('⚠️  Impossible d\'exécuter via API REST')
      console.log('Erreur:', error)
      console.log('\n📝 Solution: Exécutez manuellement dans le SQL Editor de Supabase\n')
      console.log('1️⃣  Allez sur: https://supabase.com/dashboard/project/yeotvzajxwejiohmlvdr/sql')
      console.log('\n2️⃣  Collez et exécutez ce SQL:\n')
      console.log('----------------------------------------')
      console.log(migrationSQL)
      console.log('----------------------------------------\n')
      console.log('3️⃣  Puis réessayez de créer l\'utilisateur admin')
      return
    }

    const data = await response.json()
    console.log('✅ Migration appliquée avec succès!')
    console.log('Réponse:', data)

  } catch (error: any) {
    console.error('\n❌ ERREUR lors de l\'application:', error.message)
    console.log('\n📝 Solution: Exécutez manuellement dans le SQL Editor de Supabase\n')
    console.log('1️⃣  Allez sur: https://supabase.com/dashboard/project/yeotvzajxwejiohmlvdr/sql')
    console.log('\n2️⃣  Collez et exécutez ce SQL:\n')
    console.log('----------------------------------------')
    console.log(`CREATE POLICY "service_role_insert_users"
  ON users FOR INSERT
  WITH CHECK (true);`)
    console.log('----------------------------------------\n')
    console.log('3️⃣  Puis réessayez de créer l\'utilisateur admin')
  }
}

applyMigration()
