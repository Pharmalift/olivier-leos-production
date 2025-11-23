import { createClient } from '@supabase/supabase-js'

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

const IMPLANTATION_SKUS = [
  'HN100OL20',
  'BT100OL20',
  'SP030OL20',
  'CC050OL20',
  'EM075OL20',
  'MH075OL20',
  'BR005OL20',
  'HS100OL20',
  'SS080OL25',
  'SE290OL25',
  'ER500OL25',
  'SH290OL25'
]

async function checkSKUs() {
  console.log('🔍 Vérification des SKU pour l\'implantation...\n')

  const { data: products, error } = await supabase
    .from('products')
    .select('sku, name')
    .order('sku')

  if (error) {
    console.error('❌ Erreur:', error)
    return
  }

  console.log('📦 Produits attendus pour l\'implantation:')
  IMPLANTATION_SKUS.forEach(sku => {
    const found = products?.find(p => p.sku === sku)
    if (found) {
      console.log(`  ✅ ${sku}: ${found.name}`)
    } else {
      console.log(`  ❌ ${sku}: NON TROUVÉ`)
    }
  })

  console.log('\n📋 Tous les produits dans la base:')
  products?.forEach(p => {
    console.log(`  ${p.sku}: ${p.name}`)
  })
}

checkSKUs()
