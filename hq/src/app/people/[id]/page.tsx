import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PersonDetail from '@/components/people/PersonDetail'
import type { Person, Interaction } from '@/types'

interface Props {
  params: { id: string }
}

export default async function PersonPage({ params }: Props) {
  const supabase = createClient()

  const { data: person } = await supabase
    .from('people')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!person) notFound()

  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('person_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <PersonDetail
      person={person as Person}
      interactions={(interactions ?? []) as Interaction[]}
    />
  )
}
