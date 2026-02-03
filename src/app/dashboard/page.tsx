import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils'
import { AGENT_CATEGORIES, AgentCategory, Conversation } from '@/types'
import { MessageCircle, CreditCard, Clock, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get recent conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      agents (name, category)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  // Get usage summary for current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: usageRecords } = await supabase
    .from('usage_records')
    .select('cost, tokens_used')
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  const totalCost = usageRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0
  const totalMessages = usageRecords?.length || 0

  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground">
            ようこそ、{user.user_metadata?.name || user.email}さん
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月の利用額</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(totalCost)}</div>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月のメッセージ数</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                送信したメッセージ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">会話数</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversations?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                アクティブな会話
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>最近の会話</CardTitle>
                <CardDescription>直近の会話履歴</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/agents">
                  新しい会話を始める
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {conversations && conversations.length > 0 ? (
              <div className="space-y-4">
                {conversations.map((conv: Conversation & { agents: { name: string; category: string } }) => (
                  <Link
                    key={conv.id}
                    href={`/agents/${conv.agent_id}/chat`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{conv.agents?.name || 'エージェント'}</p>
                      <p className="text-sm text-muted-foreground">
                        {AGENT_CATEGORIES[conv.agents?.category as AgentCategory] || conv.agents?.category}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {formatDate(conv.updated_at)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                まだ会話がありません。エージェントと会話を始めましょう。
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
