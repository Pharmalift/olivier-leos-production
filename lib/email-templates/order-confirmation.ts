interface OrderProduct {
  sku: string
  name: string
  quantity: number
  unit_price: number
  line_total: number
  vat_rate: number
}

interface OrderConfirmationData {
  orderNumber: string
  orderDate: string
  pharmacyName: string
  commercialName: string
  products: OrderProduct[]
  totalHT: number
  totalTVA: number
  totalTTC: number
}

export function generateOrderConfirmationEmail(data: OrderConfirmationData): string {
  const {
    orderNumber,
    orderDate,
    pharmacyName,
    commercialName,
    products,
    totalHT,
    totalTVA,
    totalTTC,
  } = data

  // Formater la date en français
  const formattedDate = new Date(orderDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  // Générer les lignes de produits
  const productRows = products
    .map(
      (product, index) => `
    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
      <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; font-size: 14px; color: #374151;">
        ${product.sku}
      </td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; font-size: 14px; color: #374151;">
        <strong>${product.name}</strong>
      </td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #374151;">
        ${product.quantity}
      </td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; font-size: 14px; color: #374151;">
        ${product.unit_price.toFixed(2)} €
      </td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; font-size: 14px; color: #374151; font-weight: 600;">
        ${product.line_total.toFixed(2)} €
      </td>
    </tr>
  `
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F5F5DC;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F5F5DC;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6B8E23 0%, #2D5016 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 36px; font-weight: bold; color: #ffffff; margin-bottom: 10px;">
                🫒 L'Olivier de Leos
              </div>
              <div style="font-size: 16px; color: #F5F5DC; font-weight: 300;">
                Confirmation de commande
              </div>
            </td>
          </tr>

          <!-- Message de remerciement -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #6B8E23; font-size: 24px; margin: 0 0 20px 0;">
                Bonjour ${pharmacyName},
              </h2>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Merci pour votre confiance ! Nous avons bien reçu votre commande et elle est en cours de traitement.
              </p>
            </td>
          </tr>

          <!-- Informations de la commande -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #f9fafb; border-left: 4px solid #6B8E23; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                <h3 style="color: #6B8E23; font-size: 18px; margin: 0 0 15px 0;">
                  📋 Informations de la commande
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">N° de commande :</td>
                    <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 16px; font-weight: 700;">
                      ${orderNumber}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date de commande :</td>
                    <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">
                      ${formattedDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Commercial :</td>
                    <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">
                      ${commercialName}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Tableau des produits -->
              <h3 style="color: #6B8E23; font-size: 18px; margin: 0 0 15px 0;">
                📦 Détail de votre commande
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #6B8E23;">
                    <th style="padding: 12px; border: 1px solid #6B8E23; text-align: left; font-size: 14px; color: #ffffff; font-weight: 600;">
                      SKU
                    </th>
                    <th style="padding: 12px; border: 1px solid #6B8E23; text-align: left; font-size: 14px; color: #ffffff; font-weight: 600;">
                      Produit
                    </th>
                    <th style="padding: 12px; border: 1px solid #6B8E23; text-align: center; font-size: 14px; color: #ffffff; font-weight: 600;">
                      Qté
                    </th>
                    <th style="padding: 12px; border: 1px solid #6B8E23; text-align: right; font-size: 14px; color: #ffffff; font-weight: 600;">
                      Prix HT
                    </th>
                    <th style="padding: 12px; border: 1px solid #6B8E23; text-align: right; font-size: 14px; color: #ffffff; font-weight: 600;">
                      Total HT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${productRows}
                </tbody>
              </table>

              <!-- Récapitulatif financier -->
              <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                <table role="presentation" style="width: 100%; max-width: 300px; margin-left: auto; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 15px; text-align: right; padding-right: 20px;">
                      Total HT :
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 16px; font-weight: 600; text-align: right;">
                      ${totalHT.toFixed(2)} €
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 15px; text-align: right; padding-right: 20px;">
                      TVA (20%) :
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 16px; font-weight: 600; text-align: right;">
                      ${totalTVA.toFixed(2)} €
                    </td>
                  </tr>
                  <tr style="border-top: 2px solid #6B8E23;">
                    <td style="padding: 12px 0 0 0; color: #6B8E23; font-size: 18px; font-weight: 700; text-align: right; padding-right: 20px;">
                      Total TTC :
                    </td>
                    <td style="padding: 12px 0 0 0; color: #6B8E23; font-size: 22px; font-weight: 700; text-align: right;">
                      ${totalTTC.toFixed(2)} €
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Section contact -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
              <h3 style="color: #6B8E23; font-size: 18px; margin: 0 0 15px 0;">
                📞 Besoin d'aide ?
              </h3>
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                Notre équipe Pharmalift Solutions est à votre disposition pour toute question concernant votre commande.
              </p>
              <p style="color: #6B8E23; font-size: 14px; margin: 0;">
                <strong>Email :</strong> info@pharmaliftsolutions.com<br>
                <strong>Téléphone :</strong> Disponible sur demande
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #2D5016; padding: 20px 30px; text-align: center;">
              <p style="color: #F5F5DC; font-size: 12px; margin: 0; line-height: 1.5;">
                © ${new Date().getFullYear()} Pharmalift Solutions - L'Olivier de Leos<br>
                Tous droits réservés
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
