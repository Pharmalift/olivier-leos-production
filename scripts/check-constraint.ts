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

async function checkConstraint() {
  console.log('🔍 Vérification de la contrainte status sur la table pharmacies...\n')

  // Requête SQL pour obtenir la définition de la contrainte
  const { data, error } = await supabase
    .from('pharmacies')
    .select('status')
    .limit(0)

  if (error) {
    console.error('Erreur:', error)
    return
  }

  console.log('Tentative de test avec différentes valeurs...\n')

  // Créer une pharmacie test avec différents statuts
  const testStatuses = [
    'prospect',
    'actif',
    'active',  // en anglais
    'client',
    'inactif',
    'inactive',  // en anglais
  ]

  for (const status of testStatuses) {
    const { data, error } = await supabase
      .from('pharmacies')
      .insert({
        name: `Test ${status}`,
        address: '1 rue Test',
        postal_code: '75001',
        city: 'Paris',
        sector: 'Test',
        status: status,
        discount_rate: 21
      })

    if (error) {
      console.log(`❌ "${status}": ${error.message}`)
    } else {
      console.log(`✅ "${status}": ACCEPTÉ`)
      // Supprimer immédiatement
      if (data && data.length > 0) {
        await supabase.from('pharmacies').delete().eq('id', (data as any)[0].id)
      }
    }
  }
}

checkConstraint()
