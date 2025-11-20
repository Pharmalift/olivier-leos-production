/**
 * Script pour vérifier le schéma de la table order_lines
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

async function checkOrderLinesSchema() {
  console.log('\n🔍 Vérification du schéma de la table order_lines...\n')

  try {
    // Essayer de récupérer une ligne de commande pour voir les colonnes
    const { data: orderLines, error } = await supabaseAdmin
      .from('order_lines')
      .select('*')
      .limit(1)

    if (error && !error.message.includes('0 rows')) {
      console.error('❌ Erreur:', error)
      return
    }

    if (!orderLines || orderLines.length === 0) {
      console.log('⚠️  Aucune ligne de commande trouvée dans la base de données')
      console.log('Mais la table existe. Voici ce qu\'on peut déduire de l\'erreur:')
      console.log('   - La colonne "unit_price_ht" existe et est NOT NULL')
      console.log('   - Le code essaie d\'insérer "unit_price" au lieu de "unit_price_ht"')
      return
    }

    console.log(`✅ ${orderLines.length} ligne(s) de commande trouvée(s)\n`)

    console.log('📋 Colonnes présentes dans la table order_lines:')
    const firstLine = orderLines[0]
    Object.keys(firstLine).forEach(key => {
      console.log(`   - ${key}: ${typeof firstLine[key]}`)
    })

    // Vérifier les colonnes attendues
    console.log('\n\n🔎 Vérification des colonnes:')
    const expectedColumns = ['order_id', 'product_id', 'product_name', 'product_sku', 'quantity', 'unit_price_ht', 'line_total']

    expectedColumns.forEach(col => {
      if (col in firstLine) {
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

checkOrderLinesSchema()
