// app/api/appointments/route.ts
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { appointmentRateLimit, fallbackAppointmentRateLimit, checkRateLimit } from '@/lib/upstash-rate-limit'
import { z } from 'zod'

const publicAppointmentSchema = z.object({
  psychologist_id: z.string().uuid("Geçersiz psikolog ID'si"),
  guest_name: z.string().min(1, "Danışan adı zorunlu"),
  guest_phone: z.string().min(1, "Telefon numarası zorunlu"),
  guest_email: z.string().email().optional(),
  guest_note: z.string().optional(),
  session_type: z.string().optional(),
  starts_at: z.string().optional(),
  duration_min: z.number().min(1, "Süre en az 1 dakika olmalıdır").max(300, "Süre en fazla 300 dakika olabilir").optional(),
  notes: z.string().optional()
})

const panelAppointmentSchema = z.object({
  _panel_add: z.boolean(),
  guest_name: z.string().optional(),
  starts_at: z.string().min(1, "Tarih zorunlu"),
  client_id: z.string().uuid().optional(),
  guest_phone: z.string().optional(),
  guest_email: z.string().email().optional(),
  guest_note: z.string().optional(),
  session_type: z.string().optional(),
  duration_min: z.number().min(1, "Süre en az 1 dakika olmalıdır").max(300, "Süre en fazla 300 dakika olabilir").optional(),
  notes: z.string().optional()
}).refine((data) => data.client_id || data.guest_name, {
  message: "Ya kayıtlı danışan seçilmeli ya da misafir adı girilmelidir",
  path: ["client_id"]
})

const appointmentUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  notes: z.string().optional(),
  price: z.number().min(0, "Fiyat 0'dan küçük olamaz").optional(),
  client_id: z.string().uuid().nullable().optional()
})

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
  
  // Apply rate limiting for ALL requests to prevent bypass
  const rateLimitResult = await checkRateLimit(req, appointmentRateLimit, fallbackAppointmentRateLimit)
  if (!rateLimitResult.success) {
    const response = NextResponse.json({ error: rateLimitResult.error }, { status: 429 })
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
    return response
  }
  
  // Panel tarafından ekleme (authenticated)
  if (body._panel_add) {
    // Validate with panel schema
    const validationResult = panelAppointmentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Geçersiz veri: ' + validationResult.error.issues.map((e: any) => e.message).join(', ') 
      }, { status: 400 })
    }

    const { guest_name, client_id, guest_phone, guest_email, guest_note, session_type, starts_at, duration_min, notes } = validationResult.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        psychologist_id: user.id,
        client_id: client_id ?? null,
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
  // Validate with public schema
  const validationResult = publicAppointmentSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json({ 
      error: 'Geçersiz veri: ' + validationResult.error.issues.map((e: any) => e.message).join(', ') 
    }, { status: 400 })
  }

  const { psychologist_id, guest_name, guest_phone, guest_email, guest_note, session_type, starts_at, duration_min } = validationResult.data

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      psychologist_id,
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
  
  // Validate with Zod
  const validationResult = appointmentUpdateSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json({ 
      error: 'Geçersiz veri: ' + validationResult.error.issues.map((e: any) => e.message).join(', ') 
    }, { status: 400 })
  }

  const { id, status, notes, price, client_id } = validationResult.data

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
