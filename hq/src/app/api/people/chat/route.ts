export const runtime = 'nodejs'

import { anthropic } from '@/lib/anthropic'
import { buildPersonSystemPrompt } from '@/lib/prompts'
import { createServiceClient } from '@/lib/supabase/server'
import type { ChatMessage } from '@/types'

export async function POST(req: Request) {
  const { personId, messages } = (await req.json()) as {
    personId: string
    messages: ChatMessage[]
  }

  const supabase = createServiceClient()
  const system = await buildPersonSystemPrompt(supabase, personId)

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system,
    messages,
  })

  return new Response(stream.toReadableStream())
}
