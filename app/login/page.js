'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
const supabase = createClient()
  useEffect(() => {
    if (!supabase) return
  }, [])

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google'
    })
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <button
        onClick={signIn}
        className="bg-black text-white px-6 py-3 rounded"
      >
        Sign in with Google
      </button>
    </div>
  )
}
