// app/api/clients/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('psychologist_id', user.id)
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { full_name, phone, email, session_type, notes } = body

  if (!full_name) return NextResponse.json({ error: 'Ad zorunlu' }, { status: 400 })

  const { data, error } = await supabase
    .from('clients')
    .insert({ psychologist_id: user.id, full_name, phone, email, session_type, notes, status: 'new' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .eq('psychologist_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 })

  // Check if client has appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('client_id', id)
    .eq('psychologist_id', user.id)
    .limit(1)

  if (appointments && appointments.length > 0) {
    // Update appointments to remove client reference but keep guest info
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        client_id: null,
        guest_name: null, // Will be updated with client name
        guest_phone: null,
        guest_email: null
      })
      .eq('client_id', id)
      .eq('psychologist_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Randevular güncellenemedi: ' + updateError.message }, { status: 500 })
    }
  }

  // Delete the client
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('psychologist_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
