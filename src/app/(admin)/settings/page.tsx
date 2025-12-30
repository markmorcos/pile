'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  slug: string
}

export default function SettingsPage() {
  const { token, signOut, user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (token) {
      fetchProfile()
    }
  }, [token])

  const fetchProfile = async () => {
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      return
    }

    setDeleting(true)

    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Sign out and redirect to home
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete account')
      setDeleting(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Account Info */}
          {user && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4">Account</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Email:
                  </span>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Slug Settings */}
          {profile && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4">Your URL</h2>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  pile.bio/
                </span>
                <span className="ml-0 font-mono font-semibold">{profile.slug}</span>
              </div>
              <p className="text-sm text-gray-500">
                You can change your slug in the Profile settings.
              </p>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-900 dark:text-red-200">
              Danger Zone
            </h2>
            <p className="text-sm text-red-800 dark:text-red-300 mb-4">
              Once you delete your account, there is no going back. This will
              permanently delete your profile, all your links, and any associated
              data.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
              Delete Account
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This action <strong>cannot be undone</strong>. This will
              permanently delete your account and remove all your data from our
              servers.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Type <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700"
                placeholder="DELETE"
                autoFocus
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmation('')
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

