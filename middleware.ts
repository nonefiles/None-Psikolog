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

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!data.session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (data.session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
