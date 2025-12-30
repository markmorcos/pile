'use client'

import { AdminLayout } from '@/components/AdminLayout'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}

