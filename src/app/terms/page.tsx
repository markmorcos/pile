import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | pile.bio',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-bold text-primary">
            pile.bio
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using pile.bio, you accept and agree to be bound by the
            terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Use License</h2>
          <p className="mb-4">
            Permission is granted to use pile.bio for personal and commercial
            purposes. This license shall automatically terminate if you violate any
            of these restrictions.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">User Content</h2>
          <p className="mb-4">
            You retain all rights to the content you post on pile.bio. By posting
            content, you grant us a license to display and distribute that content.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Prohibited Uses</h2>
          <p className="mb-4">
            You may not use pile.bio for any illegal or unauthorized purpose. You
            must not violate any laws in your jurisdiction.
          </p>
        </div>
      </main>
    </div>
  )
}

