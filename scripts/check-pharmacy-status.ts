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

async function checkPharmacies() {
  console.log('📋 Vérification des statuts des pharmacies...\n')

  const { data: pharmacies, error } = await supabase
    .from('pharmacies')
    .select('id, name, status')
    .limit(10)

  if (error) {
    console.error('❌ Erreur:', error)
  } else {
    console.log('Pharmacies:')
    pharmacies?.forEach(p => {
      console.log(`  - ${p.name}: status = "${p.status}"`)
    })
  }
}

checkPharmacies()
