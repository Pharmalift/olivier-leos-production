'use client'

import Header from './Header'
import Sidebar from './Sidebar'
import { User } from '@/types/database.types'

interface AppLayoutProps {
  children: React.ReactNode
  user: User
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      <Header userName={user.full_name} userRole={user.role} />
      <div className="flex pt-16">
        <Sidebar userRole={user.role} />
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
