'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

const AVATAR_COLORS = ['#60d0f0', '#c8f060', '#f060c8', '#f09060', '#60f090', '#d060f0']
const FREQ_OPTIONS = [7, 14, 21, 30, 60, 90]

interface Props {
  onClose: () => void
}

export default function AddPersonModal({ onClose }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [notes, setNotes] = useState('')
  const [freq, setFreq] = useState(30)
  const [color, setColor] = useState(AVATAR_COLORS[0])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        role: role || null,
        notes: notes || null,
        checkin_frequency_days: freq,
        avatar_color: color,
      }),
    })
    if (res.ok) {
      const person = await res.json()
      onClose()
      router.push(`/people/${person.id}`)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-zinc-100">Add Person</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Role / how you know them</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-600"
              placeholder="e.g. Investor, Mentor, Colleague"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full resize-none bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-600"
              placeholder="Anything worth remembering..."
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Check-in frequency</label>
            <select
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm outline-none"
            >
              {FREQ_OPTIONS.map((d) => (
                <option key={d} value={d}>Every {d} days</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-2">Avatar color</label>
            <div className="flex gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-transform"
                  style={{
                    backgroundColor: c,
                    transform: color === c ? 'scale(1.25)' : 'scale(1)',
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-brand text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
