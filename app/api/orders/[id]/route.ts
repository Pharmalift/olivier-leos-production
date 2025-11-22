import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    // Get the user from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Extract the token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '')

    // Verify the user with the anon client
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent supprimer des commandes' },
        { status: 403 }
      )
    }

    // Delete order_lines first (cascade should handle this, but let's be explicit)
    const { error: linesError } = await supabaseAdmin
      .from('order_lines')
      .delete()
      .eq('order_id', orderId)

    if (linesError) {
      console.error('Error deleting order_lines:', linesError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression des lignes de commande: ' + linesError.message },
        { status: 500 }
      )
    }

    // Delete the order
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (orderError) {
      console.error('Error deleting order:', orderError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la commande: ' + orderError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Commande supprimée avec succès' },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
