import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseInMiddleware, hasSupabaseEnv } from '@/lib/supabase'

export async function middleware(req: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next()
  }
  const res = NextResponse.next()
  const supabase = createSupabaseInMiddleware(req, res)
  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    const url = new URL('/login', req.url)
    return NextResponse.redirect(url)
  }
  return res
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
