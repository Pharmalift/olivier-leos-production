/**
 * Script pour vérifier l'état des produits dans la base de données
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

async function checkProducts() {
  console.log('\n🔍 Vérification des produits dans la base de données...\n')

  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .limit(5)

    if (error) {
      console.error('❌ Erreur lors de la récupération des produits:', error)
      return
    }

    if (!products || products.length === 0) {
      console.log('⚠️  Aucun produit trouvé dans la base de données')
      return
    }

    console.log(`✅ ${products.length} produit(s) trouvé(s)\n`)

    products.forEach((product, index) => {
      console.log(`\n📦 Produit ${index + 1}:`)
      console.log('  ID:', product.id)
      console.log('  SKU:', product.sku)
      console.log('  Nom:', product.name)
      console.log('\n  Colonnes présentes:')
      Object.keys(product).forEach(key => {
        console.log(`    - ${key}: ${typeof product[key]} = ${JSON.stringify(product[key])}`)
      })
    })

    // Vérifier les colonnes attendues
    console.log('\n\n🔎 Vérification des colonnes attendues:')
    const expectedColumns = ['pcb_price', 'retail_price', 'vat_rate', 'stock_quantity']
    const firstProduct = products[0]

    expectedColumns.forEach(col => {
      if (col in firstProduct) {
        console.log(`  ✅ ${col}: présent`)
      } else {
        console.log(`  ❌ ${col}: MANQUANT`)
      }
    })

    // Vérifier les anciennes colonnes
    console.log('\n  Anciennes colonnes (à supprimer):')
    const oldColumns = ['price_ht', 'price_ttc', 'ean', 'pcb', 'price_discounted', 'discount', 'is_recommended']

    oldColumns.forEach(col => {
      if (col in firstProduct) {
        console.log(`  ⚠️  ${col}: encore présent`)
      } else {
        console.log(`  ✅ ${col}: supprimé`)
      }
    })

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message)
    console.error('\nDétails:', error)
  }
}

checkProducts()
