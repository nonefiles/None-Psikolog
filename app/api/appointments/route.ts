// app/api/appointments/route.ts
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  let query = supabase
    .from('appointments')
    .select('*, client:clients(full_name, phone)')
    .eq('psychologist_id', user.id)
    .order('starts_at')

  if (from) query = query.gte('starts_at', from)
  if (to)   query = query.lte('starts_at', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const {
    psychologist_id: bodyPsychologistId,
    _panel_add,
    guest_name, guest_phone, guest_email, guest_note,
    session_type, starts_at, duration_min, notes,
  } = body

  // Panel tarafından ekleme (authenticated)
  if (_panel_add) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!guest_name) return NextResponse.json({ error: 'Danışan adı zorunlu' }, { status: 400 })
    if (!starts_at)  return NextResponse.json({ error: 'Tarih zorunlu' }, { status: 400 })

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        psychologist_id: user.id,
        guest_name,
        guest_phone:  guest_phone  ?? null,
        guest_email:  guest_email  ?? null,
        guest_note:   guest_note   ?? null,
        session_type: session_type || 'Bireysel Terapi',
        starts_at,
        duration_min: duration_min ?? 50,
        notes:        notes        ?? null,
        status: 'confirmed',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  // Herkese açık randevu talebi (service role)
  if (!bodyPsychologistId || !guest_name || !guest_phone) {
    return NextResponse.json({ error: 'Zorunlu alanlar eksik (psikolog, ad, telefon)' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      psychologist_id: bodyPsychologistId,
      guest_name,
      guest_phone,
      guest_email:  guest_email  || null,
      guest_note:   guest_note   || null,
      session_type: session_type || 'Bireysel Terapi',
      starts_at:    starts_at    || new Date().toISOString(),
      duration_min: duration_min ?? 50,
      status: 'pending',
    })
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
  const { id, status, notes, price, client_id } = body
  if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = status
  if (notes  !== undefined) updates.notes  = notes
  if (price  !== undefined) updates.price  = price
  if (client_id !== undefined) updates.client_id = client_id

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('appointments')
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

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('psychologist_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
