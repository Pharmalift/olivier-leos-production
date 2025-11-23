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

async function testUpdate() {
  console.log('🧪 Test de mise à jour du statut d\'une pharmacie...\n')

  // Récupérer la première pharmacie
  const { data: pharmacy, error: fetchError } = await supabase
    .from('pharmacies')
    .select('*')
    .limit(1)
    .single()

  if (fetchError || !pharmacy) {
    console.error('❌ Erreur récupération:', fetchError)
    return
  }

  console.log(`Pharmacie: ${pharmacy.name}`)
  console.log(`Statut actuel: "${pharmacy.status}"\n`)

  // Tester chaque statut possible
  const statuses = ['actif', 'inactif', 'prospect']

  for (const status of statuses) {
    console.log(`Test avec status = "${status}"`)
    const { data, error } = await supabase
      .from('pharmacies')
      .update({ status: status })
      .eq('id', pharmacy.id)
      .select()

    if (error) {
      console.error(`  ❌ Erreur:`, error.message)
      console.error(`  Code:`, error.code)
      console.error(`  Détails:`, error.details)
    } else {
      console.log(`  ✅ Succès`)
    }
  }
}

testUpdate()
