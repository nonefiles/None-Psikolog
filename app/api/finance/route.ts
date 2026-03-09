// app/api/finance/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const financeEntrySchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.string().min(1, 'Tutar zorunlu'),
  description: z.string().min(1, 'Açıklama zorunlu'),
  entry_date: z.string().optional(),
  appointment_id: z.string().uuid().nullable().optional()
})

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM

  let query = supabase
    .from('finance_entries')
    .select('*')
    .eq('psychologist_id', user.id)
    .order('entry_date', { ascending: false })

  if (month) {
    query = query
      .gte('entry_date', `${month}-01`)
      .lte('entry_date', `${month}-31`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  
  // Validate with Zod
  const validationResult = financeEntrySchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json({ 
      error: 'Geçersiz veri: ' + validationResult.error.issues.map((e: any) => e.message).join(', ') 
    }, { status: 400 })
  }

  const { type, amount, description, entry_date, appointment_id } = validationResult.data

  const { data, error } = await supabase
    .from('finance_entries')
    .insert({
      psychologist_id: user.id,
      type,
      amount: parseInt(amount),
      description,
      entry_date: entry_date || new Date().toISOString().split('T')[0],
      appointment_id: appointment_id || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
