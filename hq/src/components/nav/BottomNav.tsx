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

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-40 flex">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors',
              active ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
