import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/login', '/auth/callback', '/request-distributor', '/api/seed']
  if (publicRoutes.some(r => pathname.startsWith(r))) {
    return supabaseResponse
  }

  // If not authenticated
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Fetch profile to get role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  // Role-based route protection
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url))
  }
  if (pathname.startsWith('/distributor') && role !== 'distributor') {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url))
  }
  if (pathname.startsWith('/delivery') && role !== 'delivery') {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url))
  }
  // Customer routes — accessible to customers
  if ((pathname === '/' || pathname.startsWith('/cart') || pathname.startsWith('/checkout') || pathname.startsWith('/orders') || pathname.startsWith('/account')) && role !== 'customer') {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url))
  }

  return supabaseResponse
}

function getRoleHome(role: string | undefined): string {
  switch (role) {
    case 'admin':       return '/admin'
    case 'distributor': return '/distributor'
    case 'delivery':    return '/delivery'
    default:            return '/'
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
