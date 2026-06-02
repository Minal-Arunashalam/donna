import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import COOChat from '@/components/coo/COOChat'
import type { COOMessage } from '@/types'

export default async function HomePage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('coo_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(30)

  const messages: COOMessage[] = (data ?? []) as COOMessage[]

  return (
    <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
      <Suspense>
        <COOChat initialMessages={messages} />
      </Suspense>
    </div>
  )
}
