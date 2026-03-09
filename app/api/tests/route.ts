// app/api/tests/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const testCreateSchema = z.object({
  slug: z.string().min(1, 'Slug zorunlu'),
  title: z.string().min(1, 'Başlık zorunlu'),
  description: z.string().optional(),
  questions: z.array(z.any()).optional()
})

const testUpdateSchema = z.object({
  slug: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  questions: z.array(z.any()).optional(),
  is_active: z.boolean().optional()
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('tests')
    .select('*, responses:test_responses(count)')
    .eq('psychologist_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  
  // Validate with Zod
  const validationResult = testCreateSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json({ 
      error: 'Geçersiz veri: ' + validationResult.error.issues.map((e: any) => e.message).join(', ') 
    }, { status: 400 })
  }

  const { slug, title, description, questions } = validationResult.data

  // DÜZELTME: Gereksiz profile sorgusu kaldırıldı
  const { data, error } = await supabase
    .from('tests')
    .insert({
      psychologist_id: user.id,
      slug,
      title,
      description: description || null,
      questions: questions || [],
    })
    .select()
    .single()

  if (error) {
    const msg = error.message.includes('unique') ? 'Bu URL kısaltması zaten kullanılıyor' : error.message
    return NextResponse.json({ error: msg }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 })

  // Validate with Zod
  const validationResult = testUpdateSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json({ 
      error: 'Geçersiz veri: ' + validationResult.error.issues.map((e: any) => e.message).join(', ') 
    }, { status: 400 })
  }

  const updates = validationResult.data

  const { data, error } = await supabase
    .from('tests')
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

  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 })

  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', id)
    .eq('psychologist_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
