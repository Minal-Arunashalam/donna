import { createClient } from '@/lib/supabase/server'
import PeopleList from '@/components/people/PeopleList'
import type { Person } from '@/types'

export default async function PeoplePage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('people')
    .select('*')
    .order('created_at', { ascending: false })

  const people: Person[] = (data ?? []) as Person[]

  return <PeopleList initialPeople={people} />
}
