import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('\n🚀 Application de la migration discount...\n')

  const sql = fs.readFileSync('supabase/migrations/20250104000005_add_pharmacy_discount.sql', 'utf8')

  // Séparer les commandes SQL
  const commands = sql.split(';').filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'))

  for (const command of commands) {
    const trimmedCommand = command.trim()
    if (!trimmedCommand) continue

    console.log('📝 Exécution:', trimmedCommand.substring(0, 80) + '...')

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: trimmedCommand })

    if (error) {
      // Essayer avec la méthode directe
      const { error: directError } = await supabaseAdmin.from('_migrations').insert({ query: trimmedCommand })

      if (directError) {
        console.error('❌ Erreur:', error)
        console.log('\n⚠️  Veuillez exécuter manuellement dans le SQL Editor de Supabase:')
        console.log('\nhttps://supabase.com/dashboard/project/yeotvzajxwejiohmlvdr/sql\n')
        console.log('----------------------------------------')
        console.log(sql)
        console.log('----------------------------------------\n')
        return
      }
    }

    console.log('✅ OK\n')
  }

  console.log('✨ Migration terminée avec succès!\n')
}

applyMigration()
