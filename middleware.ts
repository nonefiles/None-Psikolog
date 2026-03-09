// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // /panel/* rotaları için auth zorunlu
  if (request.nextUrl.pathname.startsWith('/panel') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Giriş yapmış kullanıcı login/register sayfasına gelirse panele yönlendir
  // ama /auth/login'a geçişe izin ver (profil henüz oluşturulmamış olabilir)
  if (
    request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/auth/login') &&
    user
  ) {
    return NextResponse.redirect(new URL('/panel', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/panel/:path*', '/auth/:path*', '/'],
}
