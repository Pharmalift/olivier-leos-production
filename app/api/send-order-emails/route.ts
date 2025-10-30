import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { generateOrderConfirmationEmail } from '@/lib/email-templates/order-confirmation'
import { generateAdminNotificationEmail } from '@/lib/email-templates/admin-notification'

// Force Node.js runtime for Nodemailer compatibility
export const runtime = 'nodejs'

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

    // Créer un client Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Récupérer les détails complets de la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        pharmacy:pharmacies!pharmacy_id(*),
        commercial:users!commercial_id(*),
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

    // Calculer les totaux
    const totalHT = order.total_amount
    const tvaRate = 0.20 // TVA 20%
    const tvaAmount = totalHT * tvaRate
    const totalTTC = totalHT + tvaAmount

    // Préparer les données pour l'email de confirmation à la pharmacie
    const pharmacyEmailData = {
      pharmacyName: order.pharmacy.name,
      orderNumber: order.order_number,
      orderDate: order.order_date,
      commercialName: order.commercial.full_name,
      products: order.order_lines.map((line: any) => ({
        sku: line.product.sku,
        name: line.product.name,
        quantity: line.quantity,
        unitPrice: line.unit_price,
        lineTotal: line.line_total,
      })),
      totalHT,
      tvaRate,
      tvaAmount,
      totalTTC,
      notes: order.notes,
    }

    // Préparer les données pour l'email de notification admin
    const adminEmailData = {
      orderNumber: order.order_number,
      pharmacyName: order.pharmacy.name,
      pharmacyCity: order.pharmacy.city,
      commercialName: order.commercial.full_name,
      totalTTC,
      orderDate: order.order_date,
      orderLink: process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/admin`
        : 'http://localhost:3000/admin',
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'philippe.levy@mac.com'

    // Envoyer les deux emails en parallèle (non-bloquant)
    const [pharmacyResult, adminResult] = await Promise.allSettled([
      // Email à la pharmacie
      sendEmail({
        to: pharmacyEmail,
        subject: `Confirmation de commande ${orderNumber} - L'Olivier de Leos`,
        html: generateOrderConfirmationEmail(pharmacyEmailData),
        text: `Confirmation de votre commande ${orderNumber}. Merci pour votre confiance!`,
        orderId: order.id,
        emailType: 'order_confirmation',
      }),

      // Email à l'admin
      sendEmail({
        to: adminEmail,
        subject: `Nouvelle commande ${orderNumber} - ${order.pharmacy.name}`,
        html: generateAdminNotificationEmail(adminEmailData),
        text: `Nouvelle commande ${orderNumber} de ${order.pharmacy.name} par ${order.commercial.full_name}`,
        orderId: order.id,
        emailType: 'admin_notification',
      }),
    ])

    // Analyser les résultats
    const results = {
      pharmacy: pharmacyResult.status === 'fulfilled' ? pharmacyResult.value : { success: false, error: (pharmacyResult as PromiseRejectedResult).reason },
      admin: adminResult.status === 'fulfilled' ? adminResult.value : { success: false, error: (adminResult as PromiseRejectedResult).reason },
    }

    console.log('Résultats envoi emails:', results)

    return NextResponse.json({
      success: true,
      message: 'Envoi des emails terminé',
      results,
    })

  } catch (error) {
    console.error('Erreur API send-order-emails:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'envoi des emails',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
