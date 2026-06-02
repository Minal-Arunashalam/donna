import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types'

interface Props {
  message: ChatMessage
  isStreaming?: boolean
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-zinc-700 text-zinc-100 rounded-br-sm'
            : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
        )}
      >
        {message.content}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-zinc-400 rounded-sm animate-pulse align-middle" />
        )}
      </div>
    </div>
  )
}
