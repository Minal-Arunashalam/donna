export interface Goal {
  id: string
  name: string
  why: string | null
  success_metric: string | null
  deadline: string | null
  progress: number
  color: string
  active: boolean
  created_at: string
}

export interface GoalAction {
  id: string
  goal_id: string
  action: string
  done: boolean
  week_of: string
  created_at: string
}

export interface COOMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Person {
  id: string
  name: string
  role: string | null
  notes: string | null
  checkin_frequency_days: number
  last_contact: string
  avatar_color: string
  created_at: string
}

export interface Interaction {
  id: string
  person_id: string
  note: string
  created_at: string
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}
