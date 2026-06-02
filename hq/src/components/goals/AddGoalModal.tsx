'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const COLORS = ['#c8f060', '#60d0f0', '#f060c8', '#f09060', '#60f090', '#d060f0']

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function AddGoalModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [why, setWhy] = useState('')
  const [successMetric, setSuccessMetric] = useState('')
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, why, success_metric: successMetric, deadline: deadline || null, color }),
    })
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-zinc-100">New Goal</h2>
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
              placeholder="e.g. Launch MVP by Q3"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Why does this matter?</label>
            <textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              rows={2}
              className="w-full resize-none bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Success metric</label>
            <input
              value={successMetric}
              onChange={(e) => setSuccessMetric(e.target.value)}
              className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-600"
              placeholder="How will you know you're done?"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
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
              {saving ? 'Saving...' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
