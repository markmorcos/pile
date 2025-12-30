import Link from 'next/link'

export const metadata = {
  title: 'Security | pile.bio',
}

export default function SecurityPage() {
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
        <h1 className="text-4xl font-bold mb-8">Security</h1>

        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-2xl font-bold mt-8 mb-4">Our Commitment to Security</h2>
          <p className="mb-4">
            We take the security of your data seriously. pile.bio implements
            industry-standard security measures to protect your information.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Authentication</h2>
          <p className="mb-4">
            We use Firebase Authentication with Google Sign-In to ensure secure
            access to your account. We never store your password.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Data Protection</h2>
          <p className="mb-4">
            All data is encrypted in transit using HTTPS. Our database is secured
            with industry-standard encryption and access controls.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Reporting Security Issues</h2>
          <p className="mb-4">
            If you discover a security vulnerability, please report it to us
            immediately. We appreciate responsible disclosure and will work with you
            to address any issues.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact</h2>
          <p className="mb-4">
            For security concerns, please email: security@pile.bio
          </p>
        </div>
      </main>
    </div>
  )
}

