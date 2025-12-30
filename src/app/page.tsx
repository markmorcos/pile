import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">pile.bio</div>
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold pb-4 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" >
            Your Link in Bio,
            <br />
            Done Right
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Create a beautiful landing page for all your links. Share one URL,
            showcase everything.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 bg-primary text-white text-lg font-semibold rounded-lg hover:opacity-90 transition"
          >
            Create Your Page
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Optimized server-side rendering for instant load times.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-2">Beautiful Design</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Gorgeous themes and layouts that make your links stand out.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Safe Publishing</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Preview changes before publishing. Your public page updates only
              when you're ready.
            </p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-12 mt-20 border-t border-border">
        <div className="flex justify-center space-x-8 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/privacy" className="hover:text-primary">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-primary">
            Terms
          </Link>
          <Link href="/imprint" className="hover:text-primary">
            Imprint
          </Link>
          <Link href="/security" className="hover:text-primary">
            Security
          </Link>
        </div>
      </footer>
    </div>
  )
}

