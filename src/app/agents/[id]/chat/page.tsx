'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from '@/components/chat/chat-message'
import { ChatInput } from '@/components/chat/chat-input'
import { createClient } from '@/lib/supabase'
import { Agent, Message, Conversation } from '@/types'
import { ArrowLeft, Bot, Loader2 } from 'lucide-react'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [agent, setAgent] = useState<Agent | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  useEffect(() => {
    const initChat = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch agent
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()

      if (!agentData) {
        router.push('/agents')
        return
      }

      setAgent(agentData as Agent)

      // Find or create conversation
      let { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (!existingConv) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            agent_id: agentId,
            title: `${(agentData as Agent).name}との会話`,
          })
          .select()
          .single()

        existingConv = newConv
      }

      setConversation(existingConv as Conversation)

      // Fetch messages
      if (existingConv) {
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', existingConv.id)
          .order('created_at', { ascending: true })

        setMessages((messagesData as Message[]) || [])
      }

      setLoading(false)
    }

    initChat()
  }, [agentId, router, supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const handleSend = async (content: string) => {
    if (!conversation || !agent) return

    setSending(true)
    setStreamingContent('')

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      role: 'user',
      content,
      tokens_used: 0,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Save user message to database
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content,
      tokens_used: Math.ceil(content.length / 3),
    })

    try {
      // Call chat API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          conversationId: conversation.id,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          fullContent += chunk
          setStreamingContent(fullContent)
        }
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversation.id,
        role: 'assistant',
        content: fullContent,
        tokens_used: Math.ceil(fullContent.length / 3),
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setStreamingContent('')

      // Save assistant message to database
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: fullContent,
        tokens_used: Math.ceil(fullContent.length / 3),
      })

      // Update conversation
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id)

      // Record usage
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('usage_records').insert({
          user_id: user.id,
          agent_id: agent.id,
          tokens_used: Math.ceil(fullContent.length / 3),
          cost: agent.price_per_message,
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      setStreamingContent('')
    }

    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold">{agent?.name}</h1>
            <p className="text-xs text-muted-foreground">オンライン</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex flex-col">
          {messages.length === 0 && !streamingContent && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-primary/10 rounded-full text-primary mb-4">
                <Bot className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                {agent?.name}との会話を始めましょう
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                質問や相談を入力して、専門家AIからアドバイスを受けましょう
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {streamingContent && (
            <ChatMessage
              message={{
                id: 'streaming',
                conversation_id: conversation?.id || '',
                role: 'assistant',
                content: streamingContent,
                tokens_used: 0,
                created_at: new Date().toISOString(),
              }}
            />
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput onSend={handleSend} loading={sending} />
    </div>
  )
}
