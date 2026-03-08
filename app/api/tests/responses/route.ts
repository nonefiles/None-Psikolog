// app/api/tests/responses/route.ts
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { test_id, respondent_name, answers } = body

  if (!test_id || !answers) {
    return NextResponse.json({ error: 'Eksik alan' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('test_responses')
    .insert({ test_id, respondent_name, answers })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
