import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { orderId, orderNumber, pharmacyEmail } = await request.json()

    console.log('📧 Demande d\'envoi d\'emails pour:', { orderId, orderNumber, pharmacyEmail })

    // Pour l'instant, juste logger et retourner un succès
    // TODO: Implémenter l'envoi réel d'emails

    return NextResponse.json({
      success: true,
      message: 'Email route accessible (envoi non implémenté)',
      data: { orderId, orderNumber, pharmacyEmail }
    })
  } catch (error) {
    console.error('Erreur API send-order-emails-v2:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors du traitement',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
