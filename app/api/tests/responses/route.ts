// app/api/tests/responses/route.ts
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { testResponseRateLimit, fallbackTestResponseRateLimit, checkRateLimit } from '@/lib/upstash-rate-limit'
import { z } from 'zod'

const testResponseSchema = z.object({
  test_id: z.string().uuid("Geçersiz test ID'si"),
  respondent_name: z.string().optional().nullable(),
  answers: z.array(z.any())
})

export async function POST(req: Request) {
  const body = await req.json()
  
  // Validate with Zod
  const validationResult = testResponseSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json({ 
      error: 'Geçersiz veri: ' + validationResult.error.issues.map((e: any) => e.message).join(', ') 
    }, { status: 400 })
  }

  const { test_id, respondent_name, answers } = validationResult.data

  // Apply rate limiting for spam protection
  const rateLimitResult = await checkRateLimit(req, testResponseRateLimit, fallbackTestResponseRateLimit)
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
  
  // Get psychologist_id from the test to include in response
  const { data: testData } = await supabase
    .from('tests')
    .select('psychologist_id')
    .eq('id', test_id)
    .single()

  if (!testData) {
    return NextResponse.json({ error: 'Test bulunamadı' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('test_responses')
    .insert({ test_id, respondent_name, answers, psychologist_id: testData.psychologist_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
