import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force Node.js runtime for email sending
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { orderId, orderNumber, pharmacyEmail } = await request.json()

    if (!orderId || !orderNumber || !pharmacyEmail) {
      return NextResponse.json(
        { error: 'Paramètres manquants: orderId, orderNumber et pharmacyEmail requis' },
        { status: 400 }
      )
    }

    console.log('📧 Demande d\'envoi d\'emails pour commande:', orderNumber)

    // Créer un client Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Récupérer les détails de la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        pharmacy:pharmacies!pharmacy_id(*),
        commercial:users!user_id(*),
        order_lines(
          *,
          product:products(*)
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Erreur récupération commande:', orderError)
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      )
    }

    // Logger les informations (l'envoi réel sera implémenté avec Resend)
    console.log('✅ Commande trouvée:', {
      orderNumber: order.order_number,
      pharmacyName: order.pharmacy.name,
      pharmacyEmail,
      commercialName: order.commercial.full_name,
      totalAmount: order.total_amount
    })

    // TODO: Implémenter l'envoi réel avec Resend ou un autre service
    // Pour l'instant, on logue juste les emails à envoyer dans Supabase
    await supabase.from('email_logs').insert([
      {
        order_id: orderId,
        recipient: pharmacyEmail,
        email_type: 'order_confirmation',
        subject: `Confirmation de commande ${orderNumber} - L'Olivier de Leos`,
        status: 'pending',
        sent_at: new Date().toISOString(),
        error_message: 'Email en attente d\'implémentation avec service externe'
      },
      {
        order_id: orderId,
        recipient: 'sgayet@solcie.fr',
        email_type: 'admin_notification',
        subject: `Nouvelle commande ${orderNumber} - ${order.pharmacy.name}`,
        status: 'pending',
        sent_at: new Date().toISOString(),
        error_message: 'Email en attente d\'implémentation avec service externe'
      }
    ])

    return NextResponse.json({
      success: true,
      message: 'Emails logged (envoi réel à implémenter)',
      data: {
        orderNumber,
        pharmacyEmail,
        adminEmail: 'sgayet@solcie.fr'
      }
    })

  } catch (error) {
    console.error('Erreur API send-order-emails:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors du traitement',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
