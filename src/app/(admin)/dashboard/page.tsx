'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSocket, useProfileRoom } from '@/contexts/SocketContext'
import Link from 'next/link'

interface Profile {
  id: string
  slug: string
  name: string | null
  bio: string | null
  publishGeneration: number
  publishedGeneration: number
  publishStatus: 'IDLE' | 'RUNNING'
}

export default function DashboardPage() {
  const { user, token } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()

  // Auto-join profile room
  useProfileRoom(profile?.id)

  useEffect(() => {
    if (token) {
      fetchProfile()
    }
  }, [token])

  useEffect(() => {
    if (socket) {
      socket.on('profile:dirty', () => {
        if (token) {
          fetchProfile()
        }
      })

      socket.on('publish:done', () => {
        if (token) {
          fetchProfile()
        }
      })

      return () => {
        socket.off('profile:dirty')
        socket.off('publish:done')
      }
    }
  }, [socket, token]) 

  const fetchProfile = async () => {
    if (!token) {
      console.error('fetchProfile called without token')
      return
    }
    
    try {
      const res = await fetch('/api/profile/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      setProfile(data.profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const hasUnpublishedChanges =
    profile && profile.publishGeneration > profile.publishedGeneration

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {!profile ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Welcome to pile.bio!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Let's set up your profile to get started.
          </p>
          <Link
            href="/profile"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition"
          >
            Set Up Profile
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Page</h2>
              {profile.publishStatus === 'RUNNING' && (
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm rounded-full">
                  Publishing...
                </span>
              )}
              {hasUnpublishedChanges && profile.publishStatus === 'IDLE' && (
                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-sm rounded-full">
                  Unpublished changes
                </span>
              )}
              {!hasUnpublishedChanges && profile.publishStatus === 'IDLE' && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full">
                  Published
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Your URL:
                </span>
                <a
                  href={`/${profile.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-primary hover:underline"
                >
                  pile.bio/{profile.slug}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/profile"
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border hover:border-primary transition"
            >
              <div className="text-2xl mb-2">👤</div>
              <h3 className="font-semibold mb-1">Edit Profile</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your name, bio, and avatar
              </p>
            </Link>

            <Link
              href="/links"
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border hover:border-primary transition"
            >
              <div className="text-2xl mb-2">🔗</div>
              <h3 className="font-semibold mb-1">Manage Links</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add, edit, or remove your links
              </p>
            </Link>

            <Link
              href="/publish"
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border hover:border-primary transition"
            >
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="font-semibold mb-1">Publish Changes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Make your changes live
              </p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

