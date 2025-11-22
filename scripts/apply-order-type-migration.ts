import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('📦 Application de la migration pour les types de commande et minimums...\n')

  try {
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250122000000_add_order_type_and_minimums.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('Exécution de la migration SQL...')

    // Diviser le SQL en commandes individuelles
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'))

    for (const command of commands) {
      console.log(`\n  Exécution: ${command.substring(0, 60)}...`)
      const { error } = await supabase.rpc('exec_sql', { sql: command })

      if (error) {
        // Si l'erreur est "column already exists", on continue
        if (error.message.includes('already exists') || error.message.includes('déjà')) {
          console.log('  ⚠️  Colonne déjà existante, on continue...')
        } else {
          throw error
        }
      } else {
        console.log('  ✅ Succès')
      }
    }

    console.log('\n✅ Migration appliquée avec succès!')

    // Vérifier les produits
    console.log('\n📊 Vérification des produits...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('sku, name, minimum_order_quantity')
      .order('sku')

    if (productsError) {
      console.error('Erreur lors de la récupération des produits:', productsError)
    } else {
      console.log('\nProduits avec leurs minimums:')
      products.forEach(p => {
        console.log(`  ${p.sku}: ${p.name} - Minimum: ${p.minimum_order_quantity} unités`)
      })
    }

    // Vérifier les commandes existantes
    console.log('\n📋 Vérification des commandes existantes...')
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('order_number, order_type, status')
      .order('created_at', { ascending: false })
      .limit(5)

    if (ordersError) {
      console.error('Erreur lors de la récupération des commandes:', ordersError)
    } else {
      console.log('\nDernières commandes:')
      orders.forEach(o => {
        console.log(`  ${o.order_number}: ${o.order_type} (${o.status})`)
      })
    }

  } catch (error: any) {
    console.error('\n❌ Erreur lors de l\'application de la migration:', error.message)
    process.exit(1)
  }
}

applyMigration()
