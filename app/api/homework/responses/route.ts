// app/api/homework/responses/route.ts
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { homework_id, respondent_name, answers } = body

  if (!homework_id || !answers) {
    return NextResponse.json({ error: 'Eksik alan' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('homework_responses')
    .insert({ homework_id, respondent_name: respondent_name || null, answers })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
