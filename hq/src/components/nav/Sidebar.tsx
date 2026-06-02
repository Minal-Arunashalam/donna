'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'HQ', icon: Home },
  { href: '/people', label: 'People', icon: Users },
  { href: '/goals', label: 'Goals', icon: Target },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800 z-40">
      <div className="px-6 py-5 border-b border-zinc-800">
        <span className="text-xl font-semibold tracking-tight text-zinc-100">HQ</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
