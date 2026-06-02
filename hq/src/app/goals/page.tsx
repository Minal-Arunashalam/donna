import { createClient } from '@/lib/supabase/server'
import GoalsGrid from '@/components/goals/GoalsGrid'
import type { Goal } from '@/types'

export default async function GoalsPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false })

  const goals: Goal[] = (data ?? []) as Goal[]

  return <GoalsGrid initialGoals={goals} />
}
