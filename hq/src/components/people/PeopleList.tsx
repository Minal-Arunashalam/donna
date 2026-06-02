'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PersonCard from './PersonCard'
import AddPersonModal from './AddPersonModal'
import { urgencySort } from '@/lib/utils'
import type { Person } from '@/types'

interface Props {
  initialPeople: Person[]
}

export default function PeopleList({ initialPeople }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const sorted = urgencySort(initialPeople)
    if (!search.trim()) return sorted
    const q = search.toLowerCase()
    return sorted.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.role ?? '').toLowerCase().includes(q)
    )
  }, [initialPeople, search])

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold text-zinc-100">People</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 bg-brand text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Add Person
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or role..."
          className="w-full bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-zinc-600 mb-5"
        />

        {filtered.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-16">
            {search ? 'No results.' : 'No people yet. Add someone to get started.'}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddPersonModal onClose={() => setShowAdd(false)} />}
    </>
  )
}
