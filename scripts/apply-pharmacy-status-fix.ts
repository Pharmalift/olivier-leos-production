import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function applyFix() {
  console.log('🔧 Application du correctif pour les statuts de pharmacies...\n')

  try {
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250122000001_fix_pharmacy_status.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 SQL à exécuter:')
    console.log(migrationSQL)
    console.log('\n' + '='.repeat(60) + '\n')

    // Diviser en commandes
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    for (const command of commands) {
      console.log(`Exécution: ${command.substring(0, 80)}...`)

      // Utiliser directement la query pour exécuter du SQL brut
      const { data, error } = await supabase.rpc('exec', { sql: command }) as any

      if (error) {
        // Essayer avec une requête directe via le client REST
        console.log('  Tentative alternative...')

        // Pour PostgreSQL, on va utiliser une approche différente
        // On va exécuter les commandes une par une

        if (command.includes('DROP CONSTRAINT')) {
          console.log('  ⚠️  Dropping constraint - peut échouer si déjà supprimée')
        } else if (command.includes('ADD CONSTRAINT')) {
          console.log('  ⏭️  Cette commande doit être exécutée manuellement dans Supabase')
        } else if (command.includes('UPDATE')) {
          console.log('  ⏭️  Cette commande doit être exécutée manuellement dans Supabase')
        }
      } else {
        console.log('  ✅ Succès')
      }
    }

    console.log('\n⚠️  IMPORTANT: Exécutez le SQL suivant manuellement dans Supabase SQL Editor:\n')
    console.log(migrationSQL)
    console.log('\n' + '='.repeat(60))

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message)
    process.exit(1)
  }
}

applyFix()
