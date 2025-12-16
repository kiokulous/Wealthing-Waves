'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-wave-primary flex items-center justify-center">
      <div className="inline-block w-16 h-16 border-4 border-[rgb(var(--accent-primary))] border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}
