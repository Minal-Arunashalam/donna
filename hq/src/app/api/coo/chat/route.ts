export const runtime = 'nodejs'

import { anthropic } from '@/lib/anthropic'
import { buildCOOSystemPrompt } from '@/lib/prompts'
import { createServiceClient } from '@/lib/supabase/server'
import type { ChatMessage } from '@/types'

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: ChatMessage[] }

  const supabase = createServiceClient()
  const system = await buildCOOSystemPrompt(supabase)

  const lastUserMessage = messages.at(-1)
  if (lastUserMessage?.role === 'user') {
    await supabase.from('coo_messages').insert({
      role: 'user',
      content: lastUserMessage.content,
    })
  }

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system,
    messages,
  })

  stream.on('finalMessage', async (msg) => {
    const text = msg.content.find((b: { type: string }) => b.type === 'text')
    if (text && text.type === 'text') {
      await supabase.from('coo_messages').insert({
        role: 'assistant',
        content: text.text,
      })
    }
  })

  return new Response(stream.toReadableStream())
}
