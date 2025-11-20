/**
 * Script pour compter tous les produits dans la base de données
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

async function countProducts() {
  console.log('\n🔢 Comptage des produits dans la base de données...\n')

  try {
    // Compter tous les produits
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Erreur:', countError)
      return
    }

    console.log(`📦 Nombre total de produits: ${totalCount}`)

    // Compter par catégorie
    const { data: categories, error: catError } = await supabaseAdmin
      .from('products')
      .select('category')

    if (catError) {
      console.error('❌ Erreur lors de la récupération des catégories:', catError)
      return
    }

    const categoryCounts = categories?.reduce((acc: any, { category }) => {
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    console.log('\n📊 Répartition par catégorie:')
    Object.entries(categoryCounts || {}).forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count} produit(s)`)
    })

    // Compter actifs vs inactifs
    const { count: activeCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: inactiveCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)

    console.log('\n✅ Statut des produits:')
    console.log(`   - Actifs: ${activeCount}`)
    console.log(`   - Inactifs: ${inactiveCount}`)

    // Vérifier les nouvelles colonnes
    const { data: sample, error: sampleError } = await supabaseAdmin
      .from('products')
      .select('id, sku, name, pcb_price, retail_price, vat_rate, stock_quantity')
      .limit(3)

    if (!sampleError && sample) {
      console.log('\n📋 Échantillon de produits:')
      sample.forEach((p, i) => {
        console.log(`\n   ${i + 1}. ${p.name} (${p.sku})`)
        console.log(`      Prix PCB: ${p.pcb_price}€`)
        console.log(`      Prix vente: ${p.retail_price}€`)
        console.log(`      TVA: ${p.vat_rate}%`)
        console.log(`      Stock: ${p.stock_quantity}`)
      })
    }

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message)
  }
}

countProducts()
