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

type ItinerarySegment = {
  label: string
  detail: string
}

type ItineraryDay = {
  title: string
  summary?: string
  segments: ItinerarySegment[]
  notes: string[]
}

const dayHeaderPatterns = [
  /^(\d+)\s*日目\s*[:：]?\s*(.*)$/,
  /^Day\s*(\d+)\s*[:：]?\s*(.*)$/i,
]

const timeSegmentPattern = /^(午前|午後|夜|朝|昼|夕方|夜間)\s*[:：]?\s*(.*)$/

function normalizeLine(line: string) {
  return line.replace(/^[・\-–—]\s*/, '').trim()
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

function parseItinerary(body: string): ItineraryDay[] | null {
  const lines = body
    .split('\n')
    .map((line) => normalizeLine(line))
    .filter((line) => line.length > 0)

  if (lines.length === 0) return null

  const days: ItineraryDay[] = []
  let current: ItineraryDay | null = null

  for (const line of lines) {
    let matchedHeader = false
    for (const pattern of dayHeaderPatterns) {
      const match = line.match(pattern)
      if (match) {
        if (current) days.push(current)
        const dayNumber = match[1]
        const summary = match[2]?.trim()
        current = {
          title: `${dayNumber}日目`,
          summary: summary || undefined,
          segments: [],
          notes: [],
        }
        matchedHeader = true
        break
      }
    }
    if (matchedHeader) continue

    if (!current) {
      current = {
        title: '旅程',
        segments: [],
        notes: [],
      }
    }

    const timeMatch = line.match(timeSegmentPattern)
    if (timeMatch) {
      current.segments.push({
        label: timeMatch[1],
        detail: timeMatch[2]?.trim() || '',
      })
    } else {
      current.notes.push(line)
    }
  }

  if (current) days.push(current)

  if (days.length === 1 && days[0].title === '旅程' && days[0].segments.length === 0) {
    return null
  }

  return days
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
            {structured.map((section) => {
              if (section.title === '旅程') {
                const itinerary = parseItinerary(section.body)
                if (itinerary) {
                  return (
                    <div key={section.title} className="space-y-2">
                      <p className="font-semibold">{section.title}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {itinerary.map((day) => (
                          <div
                            key={day.title}
                            className="rounded-lg border bg-background px-3 py-2"
                          >
                            <p className="text-sm font-semibold">{day.title}</p>
                            {day.summary && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {day.summary}
                              </p>
                            )}
                            <div className="mt-2 space-y-2">
                              {day.segments.map((segment, index) => (
                                <div key={`${day.title}-${segment.label}-${index}`}>
                                  <p className="text-xs font-semibold text-foreground">
                                    {segment.label}
                                  </p>
                                  {segment.detail && (
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                      {segment.detail}
                                    </p>
                                  )}
                                </div>
                              ))}
                              {day.notes.map((note, index) => (
                                <p
                                  key={`${day.title}-note-${index}`}
                                  className="text-xs text-muted-foreground whitespace-pre-wrap"
                                >
                                  {note}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }
              }

              if (section.title === '次の質問') {
                const questions = section.body
                  .split('\n')
                  .map((line) => normalizeLine(line))
                  .filter((line) => line.length > 0)

                return (
                  <div key={section.title} className="space-y-1">
                    <p className="font-semibold">{section.title}</p>
                    {questions.length > 0 ? (
                      <div className="space-y-1">
                        {questions.map((question, index) => (
                          <p
                            key={`${section.title}-${index}`}
                            className="text-xs text-muted-foreground"
                          >
                            ・{question}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {section.body}
                      </p>
                    )}
                  </div>
                )
              }

              return (
                <div key={section.title}>
                  <p className="font-semibold">{section.title}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {section.body}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  )
}
