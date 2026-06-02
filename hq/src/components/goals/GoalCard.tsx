import type { Goal } from '@/types'

interface Props {
  goal: Goal
  onClick: () => void
}

export default function GoalCard({ goal, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-medium text-zinc-100 text-sm leading-snug">{goal.name}</h3>
        <span
          className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${goal.color}22`, color: goal.color }}
        >
          {goal.progress}%
        </span>
      </div>

      {goal.why && (
        <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{goal.why}</p>
      )}

      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
        />
      </div>

      {goal.deadline && (
        <p className="text-xs text-zinc-500 mt-2">
          Deadline: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}
    </button>
  )
}
