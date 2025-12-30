import Link from 'next/link'

export const metadata = {
  title: 'Imprint | pile.bio',
}

export default function ImprintPage() {
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
        <h1 className="text-4xl font-bold mb-8">Imprint</h1>

        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-2xl font-bold mt-8 mb-4">Information pursuant to § 5 TMG</h2>
          <p className="mb-4">
            pile.bio
            <br />
            [Your Company Name]
            <br />
            [Your Address]
            <br />
            [Your City, Postal Code]
            <br />
            [Your Country]
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact</h2>
          <p className="mb-4">
            Email: [Your Email]
            <br />
            Phone: [Your Phone]
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Responsible for content</h2>
          <p className="mb-4">
            [Your Name]
            <br />
            [Your Address]
          </p>
        </div>
      </main>
    </div>
  )
}

