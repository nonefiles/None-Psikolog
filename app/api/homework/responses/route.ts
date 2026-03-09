// app/api/homework/responses/route.ts
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { homeworkResponseRateLimit, fallbackHomeworkResponseRateLimit, checkRateLimit } from '@/lib/upstash-rate-limit'

export async function POST(req: Request) {
  const body = await req.json()
  const { homework_id, respondent_name, answers } = body

  if (!homework_id || !answers) {
    return NextResponse.json({ error: 'Eksik alan' }, { status: 400 })
  }

  // Apply rate limiting for spam protection
  const rateLimitResult = await checkRateLimit(req, homeworkResponseRateLimit, fallbackHomeworkResponseRateLimit)
  if (!rateLimitResult.success) {
    const response = NextResponse.json({ error: rateLimitResult.error }, { status: 429 })
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
    return response
  }

  const supabase = await createServiceClient()
  
  // Get psychologist_id from the homework to include in response
  const { data: homeworkData } = await supabase
    .from('homework')
    .select('psychologist_id')
    .eq('id', homework_id)
    .single()

  if (!homeworkData) {
    return NextResponse.json({ error: 'Ödev bulunamadı' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('homework_responses')
    .insert({ homework_id, respondent_name: respondent_name || null, answers, psychologist_id: homeworkData.psychologist_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
