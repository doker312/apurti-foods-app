import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user

      // Use admin client for reliable profile upsert (bypasses RLS)
      const admin = await createAdminClient()
      const { data: existingProfile } = await admin
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // New user — create profile with default customer role
        await admin.from('users').insert({
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email,
          role: 'customer',
          is_demo_user: false,
        })
      } else {
        // Existing user — update name/email if changed
        await admin.from('users').update({
          name: user.user_metadata?.full_name || user.user_metadata?.name || existingProfile.role,
          email: user.email,
        }).eq('id', user.id)
      }

      const role = existingProfile?.role || 'customer'
      const roleHome: Record<string, string> = {
        customer: '/',
        distributor: '/distributor',
        delivery: '/delivery',
        admin: '/admin',
      }

      return NextResponse.redirect(`${origin}${roleHome[role] || '/'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
