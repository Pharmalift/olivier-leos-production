/**
 * Script pour appliquer la migration RLS manquante
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

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
  }
})

async function applyMigration() {
  console.log('\n🚀 Application de la migration RLS pour users...\n')

  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250103000000_add_users_insert_policy.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration à appliquer:')
    console.log(sql)
    console.log('\n⏳ Exécution...')

    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql })

    if (error) {
      // Si la fonction exec_sql n'existe pas, on essaie une approche alternative
      console.log('ℹ️  Fonction exec_sql non disponible')
      console.log('\n📋 Veuillez exécuter manuellement ce SQL dans le SQL Editor de Supabase:')
      console.log('\n' + sql)
      console.log('\n🔗 Dashboard: https://supabase.com/dashboard/project/yeotvzajxwejiohmlvdr/sql')
      return
    }

    console.log('✅ Migration appliquée avec succès!')

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message)
    console.log('\n📋 Veuillez exécuter manuellement ce SQL dans le SQL Editor de Supabase:')
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250103000000_add_users_insert_policy.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    console.log('\n' + sql)
    console.log('\n🔗 Dashboard: https://supabase.com/dashboard/project/yeotvzajxwejiohmlvdr/sql')
  }
}

applyMigration()
