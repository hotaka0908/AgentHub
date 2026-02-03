'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  loading?: boolean
}

export function ChatInput({ onSend, disabled, loading }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (input.trim() && !disabled && !loading) {
      onSend(input.trim())
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  return (
    <div className="flex gap-2 items-end p-4 border-t bg-background">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="メッセージを入力..."
        disabled={disabled || loading}
        className="flex-1 resize-none border rounded-lg px-4 py-3 min-h-[48px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-ring"
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!input.trim() || disabled || loading}
        size="icon"
        className="h-12 w-12"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  )
}
