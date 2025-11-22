'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, Building2, ShoppingCart, FileText, Settings, BarChart3 } from 'lucide-react'

interface SidebarProps {
  userRole: 'commercial' | 'admin'
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const navigationItems = [
    { href: '/', label: 'Dashboard', icon: Home, roles: ['commercial', 'admin'] },
    { href: '/products', label: 'Catalogue', icon: Package, roles: ['commercial', 'admin'] },
    { href: '/pharmacies', label: 'Pharmacies', icon: Building2, roles: ['commercial', 'admin'] },
    { href: '/orders/new', label: 'Nouvelle commande', icon: ShoppingCart, roles: ['commercial', 'admin'] },
    { href: '/orders', label: 'Commandes', icon: FileText, roles: ['commercial', 'admin'] },
    { href: '/kpi', label: 'KPI & Analytics', icon: BarChart3, roles: ['admin'] },
    { href: '/admin', label: 'Administration', icon: Settings, roles: ['admin'] },
  ]

  const filteredItems = navigationItems.filter(item => item.roles.includes(userRole))

  return (
    <aside className="w-64 bg-[#6B8E23] text-white min-h-screen fixed left-0 top-16 bottom-0 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white text-[#6B8E23] font-semibold'
                      : 'hover:bg-[#5a7a1d] text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
