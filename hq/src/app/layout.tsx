import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/nav/Sidebar'
import BottomNav from '@/components/nav/BottomNav'

export const metadata: Metadata = {
  title: 'HQ',
  description: 'Personal operating system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="bg-zinc-950 text-zinc-100 flex h-full">
        <Sidebar />
        <main className="flex-1 md:ml-64 pb-16 md:pb-0 min-h-full overflow-y-auto">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
