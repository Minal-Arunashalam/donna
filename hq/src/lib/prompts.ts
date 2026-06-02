import type { SupabaseClient } from '@supabase/supabase-js'

export async function buildCOOSystemPrompt(supabase: SupabaseClient): Promise<string> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const { data: goals } = await supabase
    .from('goals')
    .select('name, why, success_metric, deadline, progress')
    .eq('active', true)
    .order('created_at', { ascending: true })

  const { data: people } = await supabase
    .from('people')
    .select('name, role, checkin_frequency_days, last_contact')

  const overduePeople = (people ?? []).filter((p) => {
    const dueAt = new Date(p.last_contact).getTime() + p.checkin_frequency_days * 86400000
    return Date.now() > dueAt
  })

  const goalsContext =
    goals && goals.length > 0
      ? goals
          .map((g) => {
            const parts = [`- ${g.name} (${g.progress}% complete)`]
            if (g.why) parts.push(`  Why: ${g.why}`)
            if (g.success_metric) parts.push(`  Success: ${g.success_metric}`)
            if (g.deadline) parts.push(`  Deadline: ${g.deadline}`)
            return parts.join('\n')
          })
          .join('\n')
      : 'No active goals set.'

  const peopleContext =
    overduePeople.length > 0
      ? overduePeople
          .map((p) => {
            const daysSince = Math.floor(
              (Date.now() - new Date(p.last_contact).getTime()) / 86400000
            )
            return `- ${p.name}${p.role ? ` (${p.role})` : ''} — last contact ${daysSince} days ago (frequency: every ${p.checkin_frequency_days} days)`
          })
          .join('\n')
      : 'No overdue check-ins.'

  return `You are a direct, no-nonsense COO and accountability partner.

YOUR ROLE:
- Hold the user accountable to their goals. Be direct, not nice.
- Give specific, actionable next steps. Never vague motivation.
- Call out drift and avoidance when you hear it.
- Keep responses to 3-5 sentences unless the user asks to elaborate.
- Ask one hard question at the end when relevant.

ACTIVE GOALS:
${goalsContext}

PEOPLE WHO MAY NEED A CHECK-IN:
${peopleContext}

TODAY: ${today}`
}

export async function buildPersonSystemPrompt(
  supabase: SupabaseClient,
  personId: string
): Promise<string> {
  const { data: person } = await supabase
    .from('people')
    .select('*')
    .eq('id', personId)
    .single()

  if (!person) return 'Help the user manage their relationships.'

  const { data: interactions } = await supabase
    .from('interactions')
    .select('note, created_at')
    .eq('person_id', personId)
    .order('created_at', { ascending: false })
    .limit(10)

  const daysSince = Math.floor(
    (Date.now() - new Date(person.last_contact).getTime()) / 86400000
  )

  const interactionsContext =
    interactions && interactions.length > 0
      ? interactions
          .map((i) => {
            const d = new Date(i.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            return `- ${d}: ${i.note}`
          })
          .join('\n')
      : 'No interactions logged yet.'

  return `You are helping the user manage their relationship with ${person.name}.

Role / how they know them: ${person.role ?? 'Not specified'}
Everything the user has noted about ${person.name}: ${person.notes ?? 'Nothing noted yet.'}
Recent interactions:
${interactionsContext}
Last contact: ${daysSince} days ago
Check-in frequency: every ${person.checkin_frequency_days} days

Help maintain a genuine relationship. Suggest specific conversation starters based on the notes. Draft messages that are direct and warm, not salesy. Keep responses concise.`
}
