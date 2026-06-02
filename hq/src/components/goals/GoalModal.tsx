'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, ArrowRight } from 'lucide-react'
import type { Goal, GoalAction } from '@/types'

interface Props {
  goal: Goal
  onClose: () => void
  onUpdated: () => void
}

export default function GoalModal({ goal, onClose, onUpdated }: Props) {
  const router = useRouter()
  const [actions, setActions] = useState<GoalAction[]>([])
  const [newAction, setNewAction] = useState('')
  const [progress, setProgress] = useState(goal.progress)
  const [progressTimer, setProgressTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const loadActions = useCallback(async () => {
    const res = await fetch(`/api/goals/${goal.id}/actions`)
    if (res.ok) setActions(await res.json())
  }, [goal.id])

  useEffect(() => {
    loadActions()
  }, [loadActions])

  const handleProgressChange = (value: number) => {
    setProgress(value)
    if (progressTimer) clearTimeout(progressTimer)
    const t = setTimeout(async () => {
      await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: value }),
      })
      onUpdated()
    }, 400)
    setProgressTimer(t)
  }

  const toggleAction = async (action: GoalAction) => {
    await fetch(`/api/goals/${goal.id}/actions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id: action.id, done: !action.done }),
    })
    setActions((prev) =>
      prev.map((a) => (a.id === action.id ? { ...a, done: !a.done } : a))
    )
  }

  const addAction = async () => {
    if (!newAction.trim()) return
    const res = await fetch(`/api/goals/${goal.id}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: newAction }),
    })
    if (res.ok) {
      const created = await res.json()
      setActions((prev) => [...prev, created])
      setNewAction('')
    }
  }

  const discussWithCOO = () => {
    router.push(`/?goal=${encodeURIComponent(goal.name)}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl overflow-y-auto max-h-full">
        <div className="p-6">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="font-semibold text-zinc-100 text-lg">{goal.name}</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 flex-shrink-0">
              <X size={18} />
            </button>
          </div>

          {goal.why && <p className="text-sm text-zinc-400 mb-1">{goal.why}</p>}
          {goal.success_metric && (
            <p className="text-xs text-zinc-500 mb-4">
              <span className="text-zinc-400">Success: </span>{goal.success_metric}
            </p>
          )}
          {goal.deadline && (
            <p className="text-xs text-zinc-500 mb-4">
              <span className="text-zinc-400">Deadline: </span>
              {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}

          {/* Progress slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">Progress</span>
              <span className="text-sm font-semibold" style={{ color: goal.color }}>
                {progress}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => handleProgressChange(Number(e.target.value))}
              className="w-full accent-brand"
            />
          </div>

          {/* This week's actions */}
          <div className="mb-5">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
              This Week
            </h3>
            <div className="space-y-2">
              {actions.map((action) => (
                <label
                  key={action.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={action.done}
                    onChange={() => toggleAction(action)}
                    className="w-4 h-4 rounded accent-brand"
                  />
                  <span
                    className={`text-sm ${
                      action.done ? 'text-zinc-600 line-through' : 'text-zinc-300'
                    }`}
                  >
                    {action.action}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <input
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAction()}
                placeholder="Add action..."
                className="flex-1 bg-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-600"
              />
              <button
                onClick={addAction}
                className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button
            onClick={discussWithCOO}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-lg text-sm font-medium transition-colors"
          >
            Discuss with COO
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
