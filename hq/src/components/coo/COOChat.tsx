'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import GoalsPillStrip from './GoalsPillStrip'
import { useStreamingChat } from '@/hooks/useStreamingChat'
import type { ChatMessage, COOMessage } from '@/types'

interface Props {
  initialMessages: COOMessage[]
}

export default function COOChat({ initialMessages }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content }))
  )
  const [streamingContent, setStreamingContent] = useState('')
  const { send, isStreaming } = useStreamingChat()

  const sendMessage = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = { role: 'user', content: text }
      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setStreamingContent('')

      await send(
        '/api/coo/chat',
        { messages: nextMessages },
        (token) => setStreamingContent((prev) => prev + token),
        () => {
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === 'assistant') return prev
            return [
              ...prev,
              { role: 'assistant', content: '' },
            ]
          })
          setStreamingContent((current) => {
            setMessages((prev) => {
              const withoutLast =
                prev[prev.length - 1]?.role === 'assistant' && prev[prev.length - 1].content === ''
                  ? prev.slice(0, -1)
                  : prev
              return [...withoutLast, { role: 'assistant', content: current }]
            })
            return ''
          })
        }
      )
    },
    [messages, send]
  )

  // Morning briefing
  useEffect(() => {
    const today = new Date().toDateString()
    if (localStorage.getItem('lastVisitDate') !== today) {
      localStorage.setItem('lastVisitDate', today)
      const timeout = setTimeout(() => sendMessage('Give me my morning briefing.'), 400)
      return () => clearTimeout(timeout)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-populate from goal query param
  useEffect(() => {
    const goalName = searchParams.get('goal')
    if (goalName) {
      router.replace('/')
      setTimeout(() => sendMessage(`I want to discuss my goal: ${goalName}`), 200)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages or streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const allDisplayMessages: ChatMessage[] = streamingContent
    ? [...messages, { role: 'assistant', content: streamingContent }]
    : messages

  return (
    <div className="flex flex-col h-full">
      <GoalsPillStrip />

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {allDisplayMessages.length === 0 && (
          <p className="text-center text-zinc-500 text-sm mt-8">
            Your COO is ready. Ask anything.
          </p>
        )}
        {allDisplayMessages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            isStreaming={
              isStreaming &&
              i === allDisplayMessages.length - 1 &&
              msg.role === 'assistant'
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} isStreaming={isStreaming} />
    </div>
  )
}
