import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true pour 465, false pour les autres ports (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Client Supabase pour les logs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface EmailOptions {
  to: string
  subject: string
  html: string
  orderId?: string
  emailType?: 'order_confirmation' | 'admin_notification'
}

/**
 * Fonction pour envoyer un email
 * @param options Options d'envoi d'email
 * @returns Promise avec le résultat de l'envoi
 */
export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  const { to, subject, html, orderId, emailType = 'order_confirmation' } = options

  // Validation de l'adresse email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(to)) {
    const error = `Adresse email invalide: ${to}`
    console.error('❌ [EMAIL]', error)

    // Logger l'échec
    await logEmail({
      orderId,
      recipient: to,
      emailType,
      subject,
      status: 'failed',
      errorMessage: error
    })

    return { success: false, error }
  }

  try {
    console.log(`📧 [EMAIL] Envoi d'un email à ${to}...`)

    // Envoyer l'email
    const info = await transporter.sendMail({
      from: `L'Olivier de Leos <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })

    console.log(`✅ [EMAIL] Email envoyé avec succès: ${info.messageId}`)

    // Logger le succès
    await logEmail({
      orderId,
      recipient: to,
      emailType,
      subject,
      status: 'sent',
      errorMessage: null
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Erreur inconnue lors de l\'envoi'
    console.error('❌ [EMAIL] Erreur lors de l\'envoi:', {
      to,
      subject,
      error: errorMessage,
      stack: error.stack
    })

    // Logger l'échec
    await logEmail({
      orderId,
      recipient: to,
      emailType,
      subject,
      status: 'failed',
      errorMessage
    })

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Logger l'envoi d'email dans la table email_logs
 */
async function logEmail(data: {
  orderId?: string
  recipient: string
  emailType: string
  subject: string
  status: 'sent' | 'failed' | 'pending'
  errorMessage: string | null
}) {
  try {
    const { error } = await supabase.from('email_logs').insert({
      order_id: data.orderId || null,
      recipient: data.recipient,
      email_type: data.emailType,
      subject: data.subject,
      status: data.status,
      sent_at: new Date().toISOString(),
      error_message: data.errorMessage,
    })

    if (error) {
      console.error('❌ [EMAIL LOG] Erreur lors du log:', error)
    }
  } catch (error) {
    console.error('❌ [EMAIL LOG] Erreur lors du log:', error)
  }
}

/**
 * Vérifier la configuration SMTP
 */
export async function verifyEmailConfig(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await transporter.verify()
    console.log('✅ [EMAIL] Configuration SMTP vérifiée avec succès')
    return { success: true }
  } catch (error: any) {
    console.error('❌ [EMAIL] Erreur de configuration SMTP:', error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}
