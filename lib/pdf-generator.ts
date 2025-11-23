import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface OrderPDFData {
  orderNumber: string
  orderDate: string
  orderType: 'implantation' | 'reassort'
  pharmacy: {
    name: string
    address: string
    postal_code: string
    city: string
    phone?: string
    email?: string
  }
  commercial: {
    full_name: string
    email?: string
  }
  orderLines: Array<{
    product_sku: string
    product_name: string
    quantity: number
    unit_price_ht: number
    line_total_ht: number
  }>
  total_before_discount: number
  discount_rate: number
  discount_amount: number
  shipping_amount: number
  total_amount: number
  notes?: string
}

export function generateOrderPDF(data: OrderPDFData): void {
  const doc = new jsPDF()

  // Couleurs
  const primaryColor: [number, number, number] = [107, 142, 35] // #6B8E23
  const lightGreen: [number, number, number] = [245, 245, 220] // #F5F5DC

  let yPosition = 20

  // === EN-TÊTE ===
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text("L'Olivier de Leos", 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Confirmation de commande', 105, 30, { align: 'center' })

  yPosition = 50

  // === INFORMATIONS COMMANDE ===
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Commande N° : ${data.orderNumber}`, 15, yPosition)

  doc.setFont('helvetica', 'normal')
  doc.text(`Date : ${new Date(data.orderDate).toLocaleDateString('fr-FR')}`, 15, yPosition + 7)
  doc.text(`Type : ${data.orderType === 'implantation' ? 'Implantation' : 'Réassort'}`, 15, yPosition + 14)

  // === PHARMACIE ===
  yPosition += 25
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Pharmacie', 15, yPosition)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(data.pharmacy.name, 15, yPosition + 7)
  doc.text(data.pharmacy.address, 15, yPosition + 13)
  doc.text(`${data.pharmacy.postal_code} ${data.pharmacy.city}`, 15, yPosition + 19)
  if (data.pharmacy.phone) {
    doc.text(`Tél : ${data.pharmacy.phone}`, 15, yPosition + 25)
  }
  if (data.pharmacy.email) {
    doc.text(`Email : ${data.pharmacy.email}`, 15, yPosition + 31)
  }

  // === COMMERCIAL ===
  const commercialY = yPosition
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Commercial', 120, commercialY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(data.commercial.full_name, 120, commercialY + 7)
  if (data.commercial.email) {
    doc.text(data.commercial.email, 120, commercialY + 13)
  }

  yPosition += 45

  // === TABLEAU DES PRODUITS ===
  const tableData = data.orderLines.map(line => [
    line.product_sku,
    line.product_name,
    line.quantity.toString(),
    `${line.unit_price_ht.toFixed(2)} €`,
    `${line.line_total_ht.toFixed(2)} €`
  ])

  autoTable(doc, {
    startY: yPosition,
    head: [['Référence', 'Produit', 'Qté', 'Prix unit. HT', 'Total HT']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    }
  })

  // Obtenir la position Y après le tableau
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50

  // === TOTAUX ===
  yPosition = finalY + 10
  const rightX = 195

  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL HT :', 140, yPosition, { align: 'right' })
  doc.text(`${data.total_before_discount.toFixed(2)} €`, rightX, yPosition, { align: 'right' })

  if (data.discount_rate > 0) {
    yPosition += 7
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 142, 35)
    doc.text(`REMISE (${data.discount_rate}%) :`, 140, yPosition, { align: 'right' })
    doc.text(`- ${data.discount_amount.toFixed(2)} €`, rightX, yPosition, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }

  yPosition += 7
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL HT APRÈS REMISE :', 140, yPosition, { align: 'right' })
  doc.text(`${(data.total_before_discount - data.discount_amount).toFixed(2)} €`, rightX, yPosition, { align: 'right' })

  yPosition += 7
  if (data.shipping_amount > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(255, 140, 0)
    doc.text('FRAIS DE PORT :', 140, yPosition, { align: 'right' })
    doc.text(`${data.shipping_amount.toFixed(2)} €`, rightX, yPosition, { align: 'right' })
  } else {
    doc.setTextColor(107, 142, 35)
    doc.text('FRAIS DE PORT :', 140, yPosition, { align: 'right' })
    doc.text('OFFERTS', rightX, yPosition, { align: 'right' })
  }
  doc.setTextColor(0, 0, 0)

  yPosition += 10
  doc.setFillColor(...lightGreen)
  doc.rect(135, yPosition - 5, 60, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL FINAL :', 140, yPosition, { align: 'right' })
  doc.text(`${data.total_amount.toFixed(2)} €`, rightX, yPosition, { align: 'right' })

  // === NOTES ===
  if (data.notes) {
    yPosition += 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes :', 15, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const splitNotes = doc.splitTextToSize(data.notes, 180)
    doc.text(splitNotes, 15, yPosition + 7)
  }

  // === PIED DE PAGE ===
  const pageHeight = doc.internal.pageSize.height
  doc.setFillColor(...primaryColor)
  doc.rect(0, pageHeight - 20, 210, 20, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text("L'Olivier de Leos - Cosmétiques naturels à l'huile d'olive", 105, pageHeight - 12, { align: 'center' })
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 105, pageHeight - 6, { align: 'center' })

  // === TÉLÉCHARGER ===
  doc.save(`Commande_${data.orderNumber}_${data.pharmacy.name.replace(/\s+/g, '_')}.pdf`)
}
