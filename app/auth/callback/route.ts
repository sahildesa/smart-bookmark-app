import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // forceRefresh forces the redirect to actually happen
      return NextResponse.redirect(`${origin}/dashboard`, { status: 303 })
    }
    
    console.error('Auth error:', error)
  }

  // Return to login if something went wrong
  return NextResponse.redirect(`${origin}/login`, { status: 303 })
}