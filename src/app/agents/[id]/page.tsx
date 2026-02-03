import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Agent, AGENT_CATEGORIES, AgentCategory } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getSeedAgentById } from '@/lib/seed-agents'
import {
  Shield,
  Home,
  Plane,
  ScrollText,
  Scale,
  Calculator,
  MessageCircle,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react'

const categoryIcons: Record<AgentCategory, React.ReactNode> = {
  insurance: <Shield className="h-8 w-8" />,
  real_estate: <Home className="h-8 w-8" />,
  travel: <Plane className="h-8 w-8" />,
  inheritance: <ScrollText className="h-8 w-8" />,
  legal: <Scale className="h-8 w-8" />,
  tax: <Calculator className="h-8 w-8" />,
}

interface AgentDetailPageProps {
  params: { id: string }
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params
  let agentRecord: Agent | null = null

  try {
    const supabase = await createServerSupabaseClient()

    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (agent) {
      agentRecord = agent as Agent
    }
  } catch (error) {
    console.error('Failed to load agent from Supabase:', error)
  }

  if (!agentRecord) {
    agentRecord = getSeedAgentById(id)
  }

  if (!agentRecord) {
    notFound()
  }

  const features = [
    '24時間いつでも相談可能',
    '専門知識に基づいた回答',
    'プライバシー保護',
    '会話履歴の保存',
  ]

  return (
    <div className="container py-8">
      <Link
        href="/agents"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        エージェント一覧に戻る
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-primary/10 rounded-xl text-primary">
              {categoryIcons[agentRecord.category as AgentCategory]}
            </div>
            <div className="space-y-2">
              <Badge variant="secondary">
                {AGENT_CATEGORIES[agentRecord.category as AgentCategory]}
              </Badge>
              <h1 className="text-3xl font-bold">{agentRecord.name}</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>エージェントについて</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {agentRecord.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>特徴</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>料金</CardTitle>
              <CardDescription>従量課金制</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {formatPrice(agentRecord.price_per_message)}
                </p>
                <p className="text-sm text-muted-foreground">/ メッセージ</p>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>・使った分だけお支払い</p>
                <p>・月額料金なし</p>
                <p>・いつでも利用停止可能</p>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link href={`/agents/${id}/chat`}>
                  <MessageCircle className="mr-2 h-5 w-5" />
                  チャットを始める
                </Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                ログイン不要でお試しできます（履歴は保存されません）
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
