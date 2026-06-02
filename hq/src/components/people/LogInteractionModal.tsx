'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Mic, MicOff } from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface Props {
  personId: string
  onClose: () => void
  onLogged: () => void
}

export default function LogInteractionModal({ personId, onClose, onLogged }: Props) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleTranscript = useCallback((text: string) => {
    setNote(text)
  }, [])

  const { isListening, startListening, stopListening, isSupported } = useVoiceInput({
    onTranscript: handleTranscript,
  })

  const handleSave = async () => {
    if (!note.trim()) return
    setSaving(true)
    await fetch(`/api/people/${personId}/log-interaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    })
    onLogged()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-zinc-100">Log Interaction</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>

        <div className="relative mb-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="What did you talk about? How did it go?"
            className="w-full resize-none bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-zinc-600 pr-12"
          />
          <div
            className="absolute bottom-3 right-3"
            title={!isSupported ? 'Use Chrome or Edge for voice' : undefined}
          >
            <button
              onMouseDown={isSupported ? startListening : undefined}
              onMouseUp={isSupported ? stopListening : undefined}
              onMouseLeave={isSupported ? stopListening : undefined}
              disabled={!isSupported}
              className={`p-1.5 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-600 text-white'
                  : isSupported
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 cursor-not-allowed'
              }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !note.trim()}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-brand text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Log'}
          </button>
        </div>
      </div>
    </div>
  )
}
