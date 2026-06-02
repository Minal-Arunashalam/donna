'use client'

import { useRef, useState, useCallback } from 'react'
import { Send, Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAutoResize } from '@/hooks/useAutoResize'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface Props {
  onSend: (text: string) => void
  isStreaming: boolean
  placeholder?: string
}

export default function ChatInput({ onSend, isStreaming, placeholder = 'Message...' }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useAutoResize(textareaRef, value)

  const handleTranscript = useCallback((text: string) => {
    setValue(text)
  }, [])

  const { isListening, startListening, stopListening, isSupported } = useVoiceInput({
    onTranscript: handleTranscript,
  })

  const handleSend = () => {
    const text = value.trim()
    if (!text || isStreaming) return
    onSend(text)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t border-zinc-800 bg-zinc-950">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full resize-none bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-zinc-600 max-h-40 overflow-y-auto"
        />
      </div>

      <div title={!isSupported ? 'Use Chrome or Edge for voice' : undefined}>
        <button
          onMouseDown={isSupported ? startListening : undefined}
          onMouseUp={isSupported ? stopListening : undefined}
          onMouseLeave={isSupported ? stopListening : undefined}
          onTouchStart={isSupported ? startListening : undefined}
          onTouchEnd={isSupported ? stopListening : undefined}
          disabled={!isSupported}
          className={cn(
            'p-3 rounded-xl transition-colors',
            isListening
              ? 'bg-red-600 text-white'
              : isSupported
              ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          )}
        >
          {isListening ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <MicOff size={16} />
            </span>
          ) : (
            <Mic size={16} />
          )}
        </button>
      </div>

      <button
        onClick={handleSend}
        disabled={!value.trim() || isStreaming}
        className={cn(
          'p-3 rounded-xl transition-colors',
          value.trim() && !isStreaming
            ? 'bg-brand text-zinc-900 hover:opacity-90'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
        )}
      >
        <Send size={16} />
      </button>
    </div>
  )
}
