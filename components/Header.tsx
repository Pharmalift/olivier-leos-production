'use client'

import Link from 'next/link'
import { LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  userName?: string
  userRole?: string
}

export default function Header({ userName, userRole }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-[#6B8E23] text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <nav className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#6B8E23] font-bold text-xl">🫒</span>
            </div>
            <Link href="/" className="text-2xl font-bold text-white">
              L'Olivier de Leos
            </Link>
          </div>

          {userName && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                <User className="w-4 h-4" />
                <div className="text-sm">
                  <div className="font-semibold">{userName}</div>
                  {userRole && (
                    <div className="text-xs text-[#F5F5DC]">
                      {userRole === 'admin' ? 'Administrateur' : 'Commercial'}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
