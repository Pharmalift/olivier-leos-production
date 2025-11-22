import { createClient } from '@supabase/supabase-js'

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
    // Étape 1: Ajouter minimum_order_quantity à products si pas déjà présent
    console.log('1. Ajout de minimum_order_quantity à la table products...')

    // Vérifier si la colonne existe déjà
    const { data: productsCheck } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (productsCheck && productsCheck.length > 0) {
      const hasMinimum = 'minimum_order_quantity' in productsCheck[0]

      if (hasMinimum) {
        console.log('   ⚠️  La colonne minimum_order_quantity existe déjà')
      } else {
        console.log('   ❌ La colonne minimum_order_quantity n\'existe pas encore')
        console.log('   ⚠️  Vous devez exécuter ce SQL manuellement dans Supabase:')
        console.log(`
        ALTER TABLE products
        ADD COLUMN minimum_order_quantity INTEGER NOT NULL DEFAULT 3;
        `)
      }
    }

    // Étape 2: Mettre à jour les minimums des produits spécifiques
    console.log('\n2. Mise à jour des minimums pour les produits spécifiques...')

    // Produits avec minimum de 6 unités
    const productsToUpdate = [
      { sku: 'BR005OL20', name: 'Beurre Réconfort 5g' },
      { sku: 'SS080OL25', name: 'Savon Olivier Verveine 80g' }
    ]

    for (const prod of productsToUpdate) {
      const { data, error } = await supabase
        .from('products')
        .update({ minimum_order_quantity: 6 })
        .eq('sku', prod.sku)

      if (error) {
        console.log(`   ❌ Erreur pour ${prod.sku}:`, error.message)
      } else {
        console.log(`   ✅ ${prod.sku} (${prod.name}): minimum = 6 unités`)
      }
    }

    // Étape 3: Vérifier order_type dans orders
    console.log('\n3. Vérification de order_type dans la table orders...')

    const { data: ordersCheck } = await supabase
      .from('orders')
      .select('*')
      .limit(1)

    if (ordersCheck && ordersCheck.length > 0) {
      const hasOrderType = 'order_type' in ordersCheck[0]

      if (hasOrderType) {
        console.log('   ⚠️  La colonne order_type existe déjà')
      } else {
        console.log('   ❌ La colonne order_type n\'existe pas encore')
        console.log('   ⚠️  Vous devez exécuter ce SQL manuellement dans Supabase:')
        console.log(`
        ALTER TABLE orders
        ADD COLUMN order_type TEXT CHECK (order_type IN ('implantation', 'reassort')) NOT NULL DEFAULT 'reassort';
        `)
      }
    } else {
      console.log('   ⚠️  Aucune commande existante pour vérifier')
    }

    // Afficher l'état des produits
    console.log('\n📊 État actuel des produits:')
    const { data: products } = await supabase
      .from('products')
      .select('sku, name, minimum_order_quantity')
      .order('sku')

    if (products) {
      products.forEach(p => {
        const min = p.minimum_order_quantity || 3
        console.log(`   ${p.sku.padEnd(12)} - ${p.name.padEnd(35)} - Minimum: ${min} unités`)
      })
    }

    console.log('\n✅ Migration terminée!')
    console.log('\n⚠️  SI LES COLONNES N\'EXISTENT PAS, copiez-collez ce SQL dans Supabase SQL Editor:')
    console.log(`
-- Ajouter minimum_order_quantity
ALTER TABLE products
ADD COLUMN IF NOT EXISTS minimum_order_quantity INTEGER NOT NULL DEFAULT 3;

-- Ajouter order_type
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type TEXT CHECK (order_type IN ('implantation', 'reassort')) NOT NULL DEFAULT 'reassort';

-- Mettre à jour les minimums spécifiques
UPDATE products SET minimum_order_quantity = 6 WHERE sku = 'BR005OL20';
UPDATE products SET minimum_order_quantity = 6 WHERE sku = 'SS080OL25';
    `)

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message)
    process.exit(1)
  }
}

applyMigration()
