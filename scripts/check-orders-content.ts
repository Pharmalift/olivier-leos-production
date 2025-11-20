/**
 * Script pour vérifier le contenu des commandes
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

async function checkOrdersContent() {
  console.log('\n🔍 Vérification du contenu des commandes...\n')

  try {
    // Récupérer les dernières commandes
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (ordersError) {
      console.error('❌ Erreur:', ordersError)
      return
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️  Aucune commande trouvée')
      return
    }

    console.log(`📦 ${orders.length} dernières commandes:\n`)

    for (const order of orders) {
      console.log(`\n🛒 Commande ${order.order_number}`)
      console.log(`   Montant: ${order.total_amount}€`)
      console.log(`   Date: ${new Date(order.created_at).toLocaleString()}`)

      // Récupérer les lignes de commande
      const { data: lines, error: linesError } = await supabaseAdmin
        .from('order_lines')
        .select('*')
        .eq('order_id', order.id)

      if (linesError) {
        console.error('   ❌ Erreur lignes:', linesError)
        continue
      }

      if (!lines || lines.length === 0) {
        console.log('   ⚠️  AUCUNE LIGNE DE COMMANDE (commande vide!)')
      } else {
        console.log(`   ✅ ${lines.length} ligne(s) de commande:`)
        lines.forEach(line => {
          console.log(`      - ${line.product_name} x${line.quantity} = ${line.line_total}€`)
          console.log(`        unit_price_ht: ${line.unit_price_ht}`)
        })
      }
    }

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message)
  }
}

checkOrdersContent()
