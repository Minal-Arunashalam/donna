import Link from 'next/link'
import { getInitials, formatDaysAgo, getDaysOverdue } from '@/lib/utils'
import type { Person } from '@/types'

interface Props {
  person: Person
}

export default function PersonCard({ person }: Props) {
  const overdue = getDaysOverdue(person)

  return (
    <Link
      href={`/people/${person.id}`}
      className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-zinc-900"
        style={{ backgroundColor: person.avatar_color }}
      >
        {getInitials(person.name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-zinc-100 text-sm truncate">{person.name}</p>
          {overdue > 0 && (
            <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-red-900/50 text-red-400 border border-red-800 rounded-full">
              {overdue}d overdue
            </span>
          )}
        </div>
        {person.role && (
          <p className="text-xs text-zinc-500 truncate">{person.role}</p>
        )}
      </div>

      <p className="text-xs text-zinc-500 flex-shrink-0">{formatDaysAgo(person.last_contact)}</p>
    </Link>
  )
}
