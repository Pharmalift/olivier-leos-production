import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

// Force Node.js runtime for Nodemailer compatibility
export const runtime = 'nodejs'

export async function GET() {
  // Protection : uniquement en développement
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'philippe.levy@mac.com'

    // Envoi d'un email de test
    const result = await sendEmail({
      to: adminEmail,
      subject: 'Test Email - L\'Olivier de Leos',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color: #6B8E23; padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">L'Olivier de Leos</h1>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #2D5016; margin-top: 0; margin-bottom: 20px;">✅ Test de configuration SMTP</h2>

                      <p style="color: #333333; line-height: 1.6; margin-bottom: 15px;">
                        Cet email confirme que la configuration SMTP est fonctionnelle.
                      </p>

                      <div style="background-color: #F5F5DC; border-left: 4px solid #6B8E23; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #2D5016; font-weight: bold;">Configuration testée :</p>
                        <ul style="margin: 10px 0 0 0; color: #333333;">
                          <li>SMTP Host: smtp.gmail.com</li>
                          <li>Port: 587 (STARTTLS)</li>
                          <li>From: info@pharmaliftsolutions.com</li>
                        </ul>
                      </div>

                      <p style="color: #333333; line-height: 1.6; margin-top: 20px;">
                        Les emails de confirmation de commande sont maintenant opérationnels.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f5f5f5; padding: 20px; text-align: center;">
                      <p style="margin: 0; color: #666666; font-size: 12px;">
                        © ${new Date().getFullYear()} Pharmalift Solutions - Tous droits réservés
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: 'Test Email - Configuration SMTP fonctionnelle'
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email de test envoyé avec succès',
        messageId: result.messageId,
        recipient: adminEmail
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        details: 'Vérifiez les logs serveur pour plus de détails'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Erreur lors du test email:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
