import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekOf = weekStart.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('goal_actions')
    .select('*')
    .eq('goal_id', params.id)
    .gte('week_of', weekOf)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('goal_actions')
    .insert({
      goal_id: params.id,
      action: body.action,
      week_of: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: Request, { params: _ }: { params: { id: string } }) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('goal_actions')
    .update({ done: body.done })
    .eq('id', body.action_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
