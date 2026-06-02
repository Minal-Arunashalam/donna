'use client'

import { useRef, useState, useCallback } from 'react'
import MessageBubble from '@/components/coo/MessageBubble'
import ChatInput from '@/components/coo/ChatInput'
import { useStreamingChat } from '@/hooks/useStreamingChat'
import type { ChatMessage } from '@/types'

const QUICK_ACTIONS = [
  'What should I talk to them about?',
  'Draft a check-in message',
  'Summarize what I know about them',
  'What did we last discuss?',
]

interface Props {
  personId: string
}

export default function PersonChat({ personId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const { send, isStreaming } = useStreamingChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { role: 'user', content: text }
      const nextMessages = [...messages, userMsg]
      setMessages(nextMessages)
      setStreamingContent('')

      await send(
        '/api/people/chat',
        { personId, messages: nextMessages },
        (token) => setStreamingContent((prev) => prev + token),
        () => {
          setStreamingContent((current) => {
            setMessages((prev) => [...prev, { role: 'assistant', content: current }])
            return ''
          })
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      )
    },
    [messages, send, personId]
  )

  const allMessages: ChatMessage[] = streamingContent
    ? [...messages, { role: 'assistant', content: streamingContent }]
    : messages

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Quick actions */}
      <div className="p-3 border-b border-zinc-800 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => sendMessage(action)}
            disabled={isStreaming}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full transition-colors disabled:opacity-50"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {allMessages.length === 0 && (
          <p className="text-center text-zinc-600 text-xs mt-4">
            Ask anything about this person, or use a quick action above.
          </p>
        )}
        {allMessages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            isStreaming={
              isStreaming &&
              i === allMessages.length - 1 &&
              msg.role === 'assistant'
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={sendMessage}
        isStreaming={isStreaming}
        placeholder="Ask about this person..."
      />
    </div>
  )
}
