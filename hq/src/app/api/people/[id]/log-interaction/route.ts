import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('interactions')
    .insert({ person_id: params.id, note: body.note })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from('people')
    .update({ last_contact: new Date().toISOString() })
    .eq('id', params.id)

  return NextResponse.json(data, { status: 201 })
}
