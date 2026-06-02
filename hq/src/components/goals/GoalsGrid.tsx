'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import GoalCard from './GoalCard'
import GoalModal from './GoalModal'
import AddGoalModal from './AddGoalModal'
import type { Goal } from '@/types'

interface Props {
  initialGoals: Goal[]
}

export default function GoalsGrid({ initialGoals }: Props) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const refresh = async () => {
    const res = await fetch('/api/goals')
    if (res.ok) setGoals(await res.json())
  }

  const activeGoals = goals.filter((g) => g.active)
  const inactiveGoals = goals.filter((g) => !g.active)

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-zinc-100">Goals</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 bg-brand text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Add Goal
          </button>
        </div>

        {activeGoals.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-16">
            No active goals. Add one to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => setSelectedGoal(goal)}
              />
            ))}
          </div>
        )}

        {inactiveGoals.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
              Archived
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
              {inactiveGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onClick={() => setSelectedGoal(goal)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedGoal && (
        <GoalModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onUpdated={refresh}
        />
      )}

      {showAdd && (
        <AddGoalModal
          onClose={() => setShowAdd(false)}
          onCreated={refresh}
        />
      )}
    </>
  )
}
