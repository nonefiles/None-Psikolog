// app/api/clients/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const clientUpdateSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  session_type: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'passive', 'new']).optional()
})

const clientCreateSchema = z.object({
  full_name: z.string().min(1, 'Ad zorunlu'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  session_type: z.string().optional(),
  notes: z.string().optional()
})

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
  
  // Validate with Zod
  const validationResult = clientCreateSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json({ 
      error: 'Geçersiz veri: ' + validationResult.error.issues.map((e: any) => e.message).join(', ') 
    }, { status: 400 })
  }

  const { full_name, phone, email, session_type, notes } = validationResult.data

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
  const { id } = body

  if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 })

  // Validate and extract only allowed fields using Zod
  const validationResult = clientUpdateSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Geçersiz veri: ' + validationResult.error.issues.map((e: any) => e.message).join(', ') }, { status: 400 })
  }

  const updates = validationResult.data

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

  // Get client info before deletion to preserve in appointments
  const { data: clientData } = await supabase
    .from('clients')
    .select('full_name, phone, email')
    .eq('id', id)
    .eq('psychologist_id', user.id)
    .single()

  // Check if client has appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('client_id', id)
    .eq('psychologist_id', user.id)
    .limit(1)

  if (appointments && appointments.length > 0) {
    // Update appointments to remove client reference but preserve guest info with real client data
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        client_id: null,
        guest_name: clientData?.full_name || null,
        guest_phone: clientData?.phone || null,
        guest_email: clientData?.email || null
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
