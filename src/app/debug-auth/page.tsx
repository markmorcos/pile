'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
  const { user, loading, token, signInWithGoogle, signOut } = useAuth()
  const [firebaseConfig, setFirebaseConfig] = useState<any>(null)

  useEffect(() => {
    // Check environment variables
    setFirebaseConfig({
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      hasMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Auth Debug</h1>

        <div className="space-y-6">
          {/* Firebase Config */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold mb-4">Firebase Configuration</h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(firebaseConfig, null, 2)}
            </pre>
          </div>

          {/* Auth State */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold mb-4">Auth State</h2>
            <div className="space-y-2">
              <div>
                <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>User:</strong> {user ? 'Authenticated' : 'Not authenticated'}
              </div>
              {user && (
                <>
                  <div>
                    <strong>Email:</strong> {user.email}
                  </div>
                  <div>
                    <strong>UID:</strong> {user.uid}
                  </div>
                  <div>
                    <strong>Display Name:</strong> {user.displayName || 'N/A'}
                  </div>
                </>
              )}
              <div>
                <strong>Has Token:</strong> {token ? 'Yes' : 'No'}
              </div>
              {token && (
                <div className="mt-2">
                  <strong>Token (first 50 chars):</strong>
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs mt-1 break-all">
                    {token.substring(0, 50)}...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4">
              {!user ? (
                <button
                  onClick={signInWithGoogle}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition"
                >
                  Sign In with Google
                </button>
              ) : (
                <button
                  onClick={signOut}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:opacity-90 transition"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Console Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Open browser console (F12 or Cmd+Option+I)</li>
              <li>Look for Firebase initialization logs</li>
              <li>Try signing in and watch the console</li>
              <li>Check for any error messages</li>
              <li>
                If Firebase config shows all "false", your environment variables
                aren't set correctly
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

