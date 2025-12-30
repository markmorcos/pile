'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from './Header'
import { SocketProvider, useSocket, useProfileRoom } from '@/contexts/SocketContext'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/profile', label: 'Profile' },
  { href: '/links', label: 'Links' },
  { href: '/appearance', label: 'Appearance' },
  { href: '/publish', label: 'Publish' },
  { href: '/settings', label: 'Settings' },
]

interface Profile {
  id: string
  publishGeneration: number
  publishedGeneration: number
}

// Inner component that uses socket context
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGoogle, token } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { socket } = useSocket()

  // Auto-join profile room
  useProfileRoom(profile?.id)

  useEffect(() => {
    console.log('AdminLayout - Auth state:', { user: !!user, loading })
  }, [user, loading])

  // Fetch profile to check for unpublished changes
  useEffect(() => {
    if (token) {
      fetchProfile()
    }
  }, [token])

  // Listen for profile changes
  useEffect(() => {
    if (socket && token) {
      console.log('[AdminLayout] Setting up socket listeners')

      socket.on('profile:dirty', () => {
        console.log('[AdminLayout] 🔔 Received profile:dirty, refetching...')
        fetchProfile()
      })

      socket.on('publish:done', () => {
        console.log('[AdminLayout] 🔔 Received publish:done, refetching...')
        fetchProfile()
      })

      return () => {
        socket.off('profile:dirty')
        socket.off('publish:done')
      }
    }
  }, [socket, token])

  const fetchProfile = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/profile/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      console.log('[AdminLayout] Profile fetched:', {
        publishGeneration: data.profile?.publishGeneration,
        publishedGeneration: data.profile?.publishedGeneration,
      })
      setProfile(data.profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const hasUnpublishedChanges = profile
    ? profile.publishGeneration > profile.publishedGeneration
    : false

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Show inline sign-in if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 mx-4">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold mb-2">Sign In Required</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in to access the admin dashboard
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary hover:shadow-lg transition-all"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              Sign in with Google
            </span>
          </button>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-primary transition"
            >
              ← Back to home
            </Link>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-50 p-4 bg-primary text-white rounded-full shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-border bg-white dark:bg-gray-800 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-2 rounded-lg transition ${
                  pathname === item.href
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{item.label}</span>
                {item.href === '/publish' && hasUnpublishedChanges && (
                  <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="lg:hidden fixed left-0 top-[73px] bottom-0 w-64 bg-white dark:bg-gray-800 z-40 border-r border-border overflow-y-auto">
              <nav className="p-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-2 rounded-lg transition ${
                      pathname === item.href
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.href === '/publish' && hasUnpublishedChanges && (
                      <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></span>
                    )}
                  </Link>
                ))}
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}

// Outer wrapper that provides SocketProvider
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SocketProvider>
  )
}

