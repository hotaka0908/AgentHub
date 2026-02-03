'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Message } from '@/types'
import { Bot, User } from 'lucide-react'

interface ChatMessageProps {
  message: Message
}

const structuredSections = ['概要', '旅程', '交通', '宿', '予算', '次の質問'] as const

type StructuredSection = {
  title: (typeof structuredSections)[number]
  body: string
}

function parseStructuredResponse(content: string): StructuredSection[] | null {
  const lines = content.split('\n')
  const sections: StructuredSection[] = []
  let current: StructuredSection | null = null

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const match = line.match(
      /^\s*-\s*(概要|旅程|交通|宿|予算|次の質問)\s*:\s*(.*)$/
    )

    if (match) {
      if (current) sections.push(current)
      const [, title, firstLine] = match as [string, StructuredSection['title'], string]
      current = { title, body: firstLine ? `${firstLine}` : '' }
      continue
    }

    if (current) {
      const nextLine = line.trim()
      if (nextLine.length > 0) {
        current.body = current.body
          ? `${current.body}\n${nextLine}`
          : nextLine
      }
    }
  }

  if (current) sections.push(current)
  if (sections.length < 2) return null

  return sections.map((section) => ({
    ...section,
    body: section.body.trim(),
  }))
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const structured = !isUser ? parseStructuredResponse(message.content) : null

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'rounded-lg px-4 py-2 max-w-[80%]',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {structured ? (
          <div className="space-y-3 text-sm text-foreground">
            {structured.map((section) => (
              <div key={section.title}>
                <p className="font-semibold">{section.title}</p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  )
}
