/**
 * Script pour vérifier le schéma de la table orders
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
  }
})

async function checkOrdersSchema() {
  console.log('\n🔍 Vérification du schéma de la table orders...\n')

  try {
    // Essayer de récupérer une commande pour voir les colonnes
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Erreur:', error)

      // Essayer de créer une commande de test pour voir les colonnes attendues
      console.log('\n⚠️  Pas de commande existante, essayons de voir les colonnes disponibles...')
      return
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️  Aucune commande trouvée dans la base de données')
      console.log('\nVérifions les colonnes disponibles en essayant une insertion de test...')
      return
    }

    console.log(`✅ ${orders.length} commande(s) trouvée(s)\n`)

    console.log('📋 Colonnes présentes dans la table orders:')
    const firstOrder = orders[0]
    Object.keys(firstOrder).forEach(key => {
      console.log(`   - ${key}: ${typeof firstOrder[key]}`)
    })

    // Vérifier les colonnes attendues
    console.log('\n\n🔎 Vérification des colonnes attendues:')
    const expectedColumns = ['commercial_id', 'user_id', 'pharmacy_id', 'status', 'total_amount', 'notes']

    expectedColumns.forEach(col => {
      if (col in firstOrder) {
        console.log(`   ✅ ${col}: présent`)
      } else {
        console.log(`   ❌ ${col}: MANQUANT`)
      }
    })

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message)
    console.error('\nDétails:', error)
  }
}

checkOrdersSchema()
