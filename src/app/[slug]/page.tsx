import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'

// Force dynamic rendering - middleware handles CDN proxy
export const dynamic = 'force-dynamic'

interface ProfilePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const profile = await prisma.profile.findUnique({
    where: { slug: params.slug },
  })

  if (!profile) {
    return {
      title: 'Profile Not Found',
    }
  }

  return {
    title: `${profile.name || profile.slug} | pile.bio`,
    description: profile.bio || `Check out ${profile.name || profile.slug}'s links`,
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const profile = await prisma.profile.findUnique({
    where: { slug: params.slug },
    include: {
      links: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!profile) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          {profile.avatarUrl && (
            <div className="mb-4 flex justify-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name || profile.slug}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">{profile.name || profile.slug}</h1>
          {profile.bio && (
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-4">
          {profile.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <div className="flex items-start space-x-4">
                {link.publishedImage && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={link.publishedImage}
                      alt={link.publishedTitle || 'Link'}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 truncate">
                    {link.publishedTitle || link.url}
                  </h3>
                  {link.publishedDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {link.publishedDescription}
                    </p>
                  )}
                </div>
                <div className="text-gray-400">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <a
            href="/"
            className="hover:text-primary transition"
            target="_blank"
          >
            Create your own page on pile.bio
          </a>
        </div>
      </div>
    </div>
  )
}

