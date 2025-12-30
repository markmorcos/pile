'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSocket, useProfileRoom } from '@/contexts/SocketContext'

interface Profile {
  id: string
  slug: string
  publishGeneration: number
  publishedGeneration: number
  publishStatus: 'IDLE' | 'RUNNING'
}

export default function PublishPage() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const { socket } = useSocket()

  // Auto-join profile room
  useProfileRoom(profile?.id)

  useEffect(() => {
    if (token) {
      fetchProfile()
    }
  }, [token])

  useEffect(() => {
    console.log('[PublishPage] Socket effect:', { hasSocket: !!socket, socketId: socket?.id })
    if (socket) {
      console.log('[PublishPage] Setting up event listeners')
      
      socket.on('publish:started', () => {
        console.log('[PublishPage] ✅ Received publish:started event')
        setPublishing(true)
      })

      socket.on('publish:done', (data) => {
        console.log('[PublishPage] ✅ Received publish:done event:', data, 'token:', token ? 'present' : 'null')
        setPublishing(false)
        if (token) {
          fetchProfile()
        } else {
          console.error('Cannot fetch profile: token is null')
        }
      })

      socket.on('publish:failed', ({ error }) => {
        console.log('[PublishPage] ❌ Received publish:failed event:', error)
        setPublishing(false)
      })

      return () => {
        console.log('[PublishPage] Cleaning up event listeners')
        socket.off('publish:started')
        socket.off('publish:done')
        socket.off('publish:failed')
      }
    } else {
      console.warn('[PublishPage] No socket available')
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
      setPublishing(data.profile?.publishStatus === 'RUNNING')
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm('Publish your changes? This will update your public page.')) {
      return
    }

    setPublishing(true)
    try {
      const res = await fetch('/api/profile/publish', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to publish')
      }
    } catch (error) {
      console.error('Error publishing:', error)
      setPublishing(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!profile) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Publish</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-border">
          <p className="text-gray-600 dark:text-gray-400">
            Please set up your profile first.
          </p>
        </div>
      </div>
    )
  }

  const hasUnpublishedChanges =
    profile.publishGeneration > profile.publishedGeneration

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Publish</h1>

      <div className="space-y-6">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Publication Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              {publishing ? (
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm rounded-full">
                  Publishing...
                </span>
              ) : hasUnpublishedChanges ? (
                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-sm rounded-full">
                  Unpublished changes
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full">
                  Up to date
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Draft version:
              </span>
              <span className="font-mono">{profile.publishGeneration}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Published version:
              </span>
              <span className="font-mono">{profile.publishedGeneration}</span>
            </div>
          </div>
        </div>

        {/* Publish Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Publish Changes</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {hasUnpublishedChanges
              ? 'You have unpublished changes. Click the button below to make them live.'
              : 'Your public page is up to date with your latest changes.'}
          </p>
          <button
            onClick={handlePublish}
            disabled={publishing || !hasUnpublishedChanges}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? 'Publishing...' : 'Publish Now'}
          </button>
          {publishing && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              This may take a minute. Your page will update automatically when done.
            </p>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-200">
            How Publishing Works
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Changes are saved as drafts automatically</li>
            <li>• Publishing copies your draft to the live version</li>
            <li>• Your public page updates instantly</li>
            <li>• Visitors always see the last published version</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

