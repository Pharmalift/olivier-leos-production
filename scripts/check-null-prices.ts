/**
 * Script pour vérifier les produits avec des prix null
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

async function checkNullPrices() {
  console.log('\n🔍 Vérification des produits avec prix null...\n')

  try {
    // Vérifier les produits avec pcb_price null
    const { data: nullPcb, error: pcbError } = await supabaseAdmin
      .from('products')
      .select('id, sku, name, pcb_price, retail_price, price_ht, price_ttc')
      .is('pcb_price', null)

    if (pcbError) {
      console.error('❌ Erreur:', pcbError)
      return
    }

    if (nullPcb && nullPcb.length > 0) {
      console.log(`⚠️  ${nullPcb.length} produit(s) avec pcb_price NULL:\n`)
      nullPcb.forEach(p => {
        console.log(`   - ${p.name} (${p.sku})`)
        console.log(`     pcb_price: ${p.pcb_price}`)
        console.log(`     retail_price: ${p.retail_price}`)
        console.log(`     price_ht (ancien): ${p.price_ht}`)
        console.log(`     price_ttc (ancien): ${p.price_ttc}\n`)
      })
    } else {
      console.log('✅ Tous les produits ont un pcb_price')
    }

    // Vérifier les produits avec retail_price null
    const { data: nullRetail, error: retailError } = await supabaseAdmin
      .from('products')
      .select('id, sku, name, pcb_price, retail_price')
      .is('retail_price', null)

    if (retailError) {
      console.error('❌ Erreur:', retailError)
      return
    }

    if (nullRetail && nullRetail.length > 0) {
      console.log(`⚠️  ${nullRetail.length} produit(s) avec retail_price NULL:\n`)
      nullRetail.forEach(p => {
        console.log(`   - ${p.name} (${p.sku})`)
      })
    } else {
      console.log('✅ Tous les produits ont un retail_price')
    }

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message)
  }
}

checkNullPrices()
