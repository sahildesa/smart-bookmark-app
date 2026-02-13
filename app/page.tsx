'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github'
    })

    if (error) console.error(error.message)
  }

  return (
    <button onClick={handleLogin}>
      Login
    </button>
  )
}
