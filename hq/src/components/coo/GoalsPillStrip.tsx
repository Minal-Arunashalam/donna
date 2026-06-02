'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Goal } from '@/types'

export default function GoalsPillStrip() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('goals')
      .select('id, name, progress, color')
      .eq('active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setGoals(data as Goal[])
      })
  }, [])

  if (goals.length === 0) return null

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Goals</span>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      <div
        className={`transition-all duration-200 overflow-hidden ${
          collapsed ? 'max-h-0' : 'max-h-20'
        }`}
      >
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {goals.map((goal) => (
            <span
              key={goal.id}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${goal.color}22`,
                color: goal.color,
                border: `1px solid ${goal.color}44`,
              }}
            >
              {goal.name}
              <span className="opacity-70">· {goal.progress}%</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
