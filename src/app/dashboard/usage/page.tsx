import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatPrice, formatDate } from '@/lib/utils'
import { AGENT_CATEGORIES, AgentCategory } from '@/types'
import { CreditCard, TrendingUp, Calendar } from 'lucide-react'

interface UsageRecord {
  id: string
  tokens_used: number
  cost: number
  created_at: string
  agents: { name: string; category: string }
}

export default async function UsagePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get all usage records
  const { data: allRecords } = await supabase
    .from('usage_records')
    .select(`
      *,
      agents (name, category)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Calculate monthly totals
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const thisMonthRecords = allRecords?.filter(
    (r) => new Date(r.created_at) >= thisMonth
  ) || []
  const lastMonthRecords = allRecords?.filter(
    (r) => new Date(r.created_at) >= lastMonth && new Date(r.created_at) < thisMonth
  ) || []

  const thisMonthTotal = thisMonthRecords.reduce((sum, r) => sum + (r.cost || 0), 0)
  const lastMonthTotal = lastMonthRecords.reduce((sum, r) => sum + (r.cost || 0), 0)

  // Calculate usage by agent
  const usageByAgent: Record<string, { name: string; category: string; cost: number; count: number }> = {}
  thisMonthRecords.forEach((record: UsageRecord) => {
    const agentName = record.agents?.name || 'Unknown'
    if (!usageByAgent[agentName]) {
      usageByAgent[agentName] = {
        name: agentName,
        category: record.agents?.category || 'other',
        cost: 0,
        count: 0,
      }
    }
    usageByAgent[agentName].cost += record.cost || 0
    usageByAgent[agentName].count += 1
  })

  const agentUsageArray = Object.values(usageByAgent).sort((a, b) => b.cost - a.cost)

  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">利用履歴・請求</h1>
          <p className="text-muted-foreground">
            利用状況と請求情報を確認できます
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月の利用額</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(thisMonthTotal)}</div>
              <p className="text-xs text-muted-foreground">
                {thisMonthRecords.length} メッセージ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">先月の利用額</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(lastMonthTotal)}</div>
              <p className="text-xs text-muted-foreground">
                {lastMonthRecords.length} メッセージ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">増減</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastMonthTotal > 0
                  ? `${((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)}%`
                  : '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                前月比
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Details */}
        <Tabs defaultValue="by-agent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="by-agent">エージェント別</TabsTrigger>
            <TabsTrigger value="history">利用履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="by-agent">
            <Card>
              <CardHeader>
                <CardTitle>エージェント別利用状況</CardTitle>
                <CardDescription>今月の利用状況をエージェント別に表示</CardDescription>
              </CardHeader>
              <CardContent>
                {agentUsageArray.length > 0 ? (
                  <div className="space-y-4">
                    {agentUsageArray.map((agent) => (
                      <div
                        key={agent.name}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {AGENT_CATEGORIES[agent.category as AgentCategory] || agent.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(agent.cost)}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.count} メッセージ
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    今月の利用履歴がありません
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>利用履歴</CardTitle>
                <CardDescription>直近の利用履歴を表示</CardDescription>
              </CardHeader>
              <CardContent>
                {allRecords && allRecords.length > 0 ? (
                  <div className="space-y-2">
                    {allRecords.slice(0, 50).map((record: UsageRecord) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{record.agents?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(record.cost)}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.tokens_used} トークン
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    利用履歴がありません
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
