import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('people')
    .insert({
      name: body.name,
      role: body.role ?? null,
      notes: body.notes ?? null,
      checkin_frequency_days: body.checkin_frequency_days ?? 30,
      avatar_color: body.avatar_color ?? '#60d0f0',
    })
    .select()
    .single()

  if (error) {
    console.error('POST /api/people error:', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
