'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSocket, useProfileRoom } from '@/contexts/SocketContext'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Link {
  id: string
  url: string
  draftTitle: string | null
  draftDescription: string | null
  draftImage: string | null
  publishedTitle: string | null
  order: number
  isActive: boolean
}

interface Profile {
  id: string
  slug: string
  publishGeneration: number
  publishedGeneration: number
}

function SortableLinkItem({
  link,
  onToggleActive,
  onDelete,
}: {
  link: Link
  onToggleActive: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 border border-border"
    >
      <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition flex-shrink-0 self-start"
          title="Drag to reorder"
        >
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </button>

        {link.draftImage && (
          <img
            src={link.draftImage}
            alt=""
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0 w-full">
          <h3 className="font-semibold text-base md:text-lg mb-1 break-words">
            {link.draftTitle || link.url}
          </h3>
          {link.draftDescription && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {link.draftDescription}
            </p>
          )}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline break-all"
          >
            {link.url}
          </a>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end sm:justify-start">
          <button
            onClick={() => onToggleActive(link.id, link.isActive)}
            className={`px-3 py-1 text-sm rounded-lg transition flex-shrink-0 ${
              link.isActive
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {link.isActive ? 'Active' : 'Hidden'}
          </button>
          <button
            onClick={() => onDelete(link.id)}
            className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition flex-shrink-0"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LinksPage() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const { socket } = useSocket()

  // Auto-join profile room
  useProfileRoom(profile?.id)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (token) {
      fetchProfile()
      fetchLinks()
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
    }
  }

  useEffect(() => {
    if (socket) {
      console.log('Setting up metadata:updated listener')
      
      socket.on('metadata:updated', ({ linkId, metadata }) => {
        console.log('Received metadata:updated', { linkId, metadata })
        setLinks((prev) =>
          prev.map((link) =>
            link.id === linkId
              ? {
                  ...link,
                  draftTitle: metadata.title,
                  draftDescription: metadata.description,
                  draftImage: metadata.image,
                }
              : link
          )
        )
      })

      return () => {
        socket.off('metadata:updated')
      }
    }
  }, [socket])

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/links', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      setLinks(data.links || [])
    } catch (error) {
      console.error('Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl) return

    setAdding(true)
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: newUrl }),
      })

      const data = await res.json()
      if (res.ok) {
        setLinks([...links, data.link])
        setNewUrl('')
      }
    } catch (error) {
      console.error('Error adding link:', error)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return

    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        setLinks(links.filter((link) => link.id !== id))
      }
    } catch (error) {
      console.error('Error deleting link:', error)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      const data = await res.json()
      if (res.ok) {
        setLinks(links.map((link) => (link.id === id ? data.link : link)))
      }
    } catch (error) {
      console.error('Error toggling link:', error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = links.findIndex((link) => link.id === active.id)
    const newIndex = links.findIndex((link) => link.id === over.id)

    // Optimistically update UI
    const newLinks = arrayMove(links, oldIndex, newIndex)
    setLinks(newLinks)

    // Update order in backend
    try {
      await fetch(`/api/links/${active.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order: newIndex }),
      })
    } catch (error) {
      console.error('Error updating link order:', error)
      // Revert on error
      fetchLinks()
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Manage Links</h1>

      {/* Add Link Form */}
      <form onSubmit={handleAddLink} className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
          <label className="block text-sm font-medium mb-2">Add New Link</label>
          <div className="flex space-x-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              required
              className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700"
            />
            <button
              type="submit"
              disabled={adding}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add Link'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Metadata will be fetched automatically
          </p>
        </div>
      </form>

      {/* Links List */}
      {links.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-border">
          <p className="text-gray-600 dark:text-gray-400">
            No links yet. Add your first link above!
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={links.map((link) => link.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {links.map((link) => (
                <SortableLinkItem
                  key={link.id}
                  link={link}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteLink}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

