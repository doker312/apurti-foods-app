import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Upsert profile
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        await supabase.from('users').insert({
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email,
          role: 'customer',
          is_demo_user: false,
        })
      }

      const role = existingProfile?.role || 'customer'
      const roleHome = role === 'admin' ? '/admin' :
                       role === 'distributor' ? '/distributor' :
                       role === 'delivery' ? '/delivery' : '/'

      return NextResponse.redirect(`${origin}${roleHome}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
