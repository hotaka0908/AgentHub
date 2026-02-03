'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [isGuest, setIsGuest] = useState(false)
  const [draft, setDraft] = useState('')
  const [travelForm, setTravelForm] = useState({
    origin: '',
    destination: '',
    dates: '',
    duration: '',
    party: '',
    budget: '',
    interests: '',
    lodging: '',
    transport: '',
    notes: '',
  })

  const buildTravelRequest = () => {
    const lines = [
      `出発地: ${travelForm.origin || '未定'}`,
      `目的地: ${travelForm.destination || '未定'}`,
      `日程: ${travelForm.dates || '未定'}`,
      `日数: ${travelForm.duration || '未定'}`,
      `人数/同行者: ${travelForm.party || '未定'}`,
      `予算: ${travelForm.budget || '未定'}`,
      `興味: ${travelForm.interests || '未定'}`,
      `宿の希望: ${travelForm.lodging || '未定'}`,
      `移動手段: ${travelForm.transport || '未定'}`,
      `補足: ${travelForm.notes || 'なし'}`,
    ]
    return lines.join('\n')
  }

  const hasTravelInput = Object.values(travelForm).some((value) => value.trim())

  useEffect(() => {
    const initChat = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const guest = !user
      setIsGuest(guest)

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

      if (!guest && user) {
        // Find or create conversation (authenticated users)
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
      } else {
        // Guest conversation (no persistence)
        setConversation({
          id: crypto.randomUUID(),
          user_id: 'guest',
          agent_id: agentId,
          title: `${(agentData as Agent).name}との会話`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        setMessages([])
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
    setDraft('')

    if (!isGuest) {
      // Save user message to database
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        role: 'user',
        content,
        tokens_used: Math.ceil(content.length / 3),
      })
    }

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

      if (!isGuest) {
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
            <p className="text-xs text-muted-foreground">
              {isGuest ? 'ゲストモード（履歴は保存されません）' : 'オンライン'}
            </p>
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
              {agent?.category === 'travel' && (
                <div className="mt-6 w-full max-w-xl space-y-4">
                  <div className="rounded-xl border bg-background p-4 text-left">
                    <p className="text-sm font-semibold mb-2">
                      旅行プラン作成フォーム
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      入力した内容から依頼文を作成できます
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="travel-origin">出発地</Label>
                        <Input
                          id="travel-origin"
                          placeholder="例: 東京"
                          value={travelForm.origin}
                          onChange={(e) =>
                            setTravelForm((prev) => ({
                              ...prev,
                              origin: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="travel-destination">目的地</Label>
                        <Input
                          id="travel-destination"
                          placeholder="例: 京都 / 未定"
                          value={travelForm.destination}
                          onChange={(e) =>
                            setTravelForm((prev) => ({
                              ...prev,
                              destination: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="travel-dates">日程</Label>
                        <Input
                          id="travel-dates"
                          placeholder="例: 4/10-4/12"
                          value={travelForm.dates}
                          onChange={(e) =>
                            setTravelForm((prev) => ({
                              ...prev,
                              dates: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="travel-duration">日数</Label>
                        <Input
                          id="travel-duration"
                          placeholder="例: 2泊3日"
                          value={travelForm.duration}
                          onChange={(e) =>
                            setTravelForm((prev) => ({
                              ...prev,
                              duration: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="travel-party">人数/同行者</Label>
                        <Input
                          id="travel-party"
                          placeholder="例: 大人2人 + 小学生1人"
                          value={travelForm.party}
                          onChange={(e) =>
                            setTravelForm((prev) => ({
                              ...prev,
                              party: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="travel-budget">予算</Label>
                        <Input
                          id="travel-budget"
                          placeholder="例: 10万円"
                          value={travelForm.budget}
                          onChange={(e) =>
                            setTravelForm((prev) => ({
                              ...prev,
                              budget: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="travel-interests">興味</Label>
                        <Input
                          id="travel-interests"
                          placeholder="例: 温泉、グルメ、自然"
                          value={travelForm.interests}
                          onChange={(e) =>
                            setTravelForm((prev) => ({
                              ...prev,
                              interests: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="travel-lodging">宿の希望</Label>
                        <Input
                          id="travel-lodging"
                          placeholder="例: 駅近・中価格帯"
                          value={travelForm.lodging}
                          onChange={(e) =>
                            setTravelForm((prev) => ({
                              ...prev,
                              lodging: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="travel-transport">移動手段</Label>
                        <Input
                          id="travel-transport"
                          placeholder="例: 公共交通"
                          value={travelForm.transport}
                          onChange={(e) =>
                            setTravelForm((prev) => ({
                              ...prev,
                              transport: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="travel-notes">補足</Label>
                        <textarea
                          id="travel-notes"
                          placeholder="例: 歩く距離は短めにしたい"
                          value={travelForm.notes}
                          onChange={(e) =>
                            setTravelForm((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          className="min-h-[84px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                    </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setDraft(buildTravelRequest())
                      }}
                      disabled={sending || !hasTravelInput}
                    >
                      依頼文を作成
                    </Button>
                    <Button
                      onClick={() => {
                        const content = buildTravelRequest()
                        setDraft(content)
                        void handleSend(content)
                      }}
                      disabled={sending || !hasTravelInput}
                    >
                      作成して送信
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setTravelForm({
                            origin: '',
                            destination: '',
                            dates: '',
                            duration: '',
                            party: '',
                            budget: '',
                            interests: '',
                            lodging: '',
                          transport: '',
                          notes: '',
                        })
                      }
                      disabled={sending}
                    >
                      クリア
                    </Button>
                  </div>
                  </div>
                  <div className="rounded-xl border bg-background p-4 text-left">
                    <p className="text-sm font-semibold mb-2">
                      旅行プラン作成テンプレート
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      まずはテンプレを入れて、必要なところだけ埋めてください
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setDraft(
                          [
                            '出発地: ',
                            '目的地: ',
                            '日程: ',
                            '人数/同行者: ',
                            '予算: ',
                            '興味: ',
                            '宿の希望: ',
                            '移動手段: ',
                          ].join('\n')
                        )
                      }
                    >
                      テンプレートを挿入
                    </Button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDraft(
                          '東京発で3泊4日。予算10万円。自然と温泉中心で、レンタカーは使わず公共交通で回れるプランを提案して。'
                        )
                      }
                    >
                      例: 国内旅行
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDraft(
                          '大阪発で5日間。予算20万円。食と街歩き重視で、行き先はまだ未定。候補と旅程を提案して。'
                        )
                      }
                    >
                      例: 行き先未定
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDraft(
                          '成田発で7日間。予算30万円。ヨーロッパで歴史と美術館中心の旅程を作って。'
                        )
                      }
                    >
                      例: 海外旅行
                    </Button>
                  </div>
                </div>
              )}
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
      <ChatInput
        onSend={handleSend}
        loading={sending}
        value={draft}
        onChange={setDraft}
      />
    </div>
  )
}
