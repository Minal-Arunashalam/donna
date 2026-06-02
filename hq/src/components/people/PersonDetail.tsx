'use client'

import { useState, useCallback } from 'react'
import { Clock } from 'lucide-react'
import LogInteractionModal from './LogInteractionModal'
import PersonChat from './PersonChat'
import { getInitials, formatDaysAgo } from '@/lib/utils'
import type { Person, Interaction } from '@/types'

const FREQ_OPTIONS = [7, 14, 21, 30, 60, 90]

interface Props {
  person: Person
  interactions: Interaction[]
}

export default function PersonDetail({ person, interactions: initialInteractions }: Props) {
  const [notes, setNotes] = useState(person.notes ?? '')
  const [freq, setFreq] = useState(person.checkin_frequency_days)
  const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions)
  const [showLog, setShowLog] = useState(false)

  const saveNotes = async () => {
    await fetch(`/api/people/${person.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
  }

  const saveFreq = async (value: number) => {
    setFreq(value)
    await fetch(`/api/people/${person.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkin_frequency_days: value }),
    })
  }

  const handleLogged = useCallback(async () => {
    const res = await fetch(`/api/people/${person.id}/interactions`)
    if (res.ok) setInteractions(await res.json())
  }, [person.id])

  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-zinc-900"
              style={{ backgroundColor: person.avatar_color }}
            >
              {getInitials(person.name)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-100">{person.name}</h1>
              {person.role && <p className="text-sm text-zinc-400">{person.role}</p>}
            </div>
          </div>

          {/* Check-in frequency */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Check-in frequency</label>
            <select
              value={freq}
              onChange={(e) => saveFreq(Number(e.target.value))}
              className="bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm outline-none"
            >
              {FREQ_OPTIONS.map((d) => (
                <option key={d} value={d}>Every {d} days</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={6}
              placeholder="Everything you know about this person..."
              className="w-full resize-none bg-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          {/* Log interaction button */}
          <button
            onClick={() => setShowLog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Clock size={14} />
            Log Interaction
          </button>

          {/* Interaction log */}
          {interactions.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
                Interaction History
              </h3>
              <div className="space-y-3">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="bg-zinc-800/50 rounded-lg px-4 py-3">
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{interaction.note}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatDaysAgo(interaction.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — chat */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col" style={{ height: '70vh' }}>
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-300">Chat about {person.name}</h2>
          </div>
          <PersonChat personId={person.id} />
        </div>
      </div>

      {showLog && (
        <LogInteractionModal
          personId={person.id}
          onClose={() => setShowLog(false)}
          onLogged={handleLogged}
        />
      )}
    </div>
  )
}
