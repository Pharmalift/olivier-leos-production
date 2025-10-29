interface AdminNotificationData {
  orderNumber: string
  pharmacyName: string
  pharmacyCity: string
  commercialName: string
  totalTTC: number
  orderDate: string
  orderLink?: string
}

export function generateAdminNotificationEmail(data: AdminNotificationData): string {
  const {
    orderNumber,
    pharmacyName,
    pharmacyCity,
    commercialName,
    totalTTC,
    orderDate,
    orderLink = 'http://localhost:3000/admin',
  } = data

  // Formater la date et l'heure en français
  const formattedDateTime = new Date(orderDate).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle commande</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 500px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #6B8E23; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 600;">
                🔔 Nouvelle commande reçue
              </h1>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Une nouvelle commande vient d'être créée dans L'Olivier de Leos.
              </p>

              <!-- Informations essentielles -->
              <div style="background-color: #f9fafb; border-left: 4px solid #6B8E23; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">
                      <strong>N° Commande:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 16px; font-weight: 700;">
                      ${orderNumber}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Pharmacie:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
                      ${pharmacyName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Ville:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
                      ${pharmacyCity}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Commercial:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
                      ${commercialName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Montant TTC:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #16a34a; font-size: 18px; font-weight: 700;">
                      ${totalTTC.toFixed(2)} €
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Date & Heure:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      ${formattedDateTime}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Bouton d'action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${orderLink}" style="display: inline-block; background-color: #6B8E23; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                  👉 Voir dans l'interface admin
                </a>
              </div>

              <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 20px 0 0 0; line-height: 1.5;">
                Cet email est envoyé automatiquement par le système L'Olivier de Leos.<br>
                Il ne nécessite pas de réponse.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
                © ${new Date().getFullYear()} Pharmalift Solutions - L'Olivier de Leos
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
