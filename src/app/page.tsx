import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Agent, AGENT_CATEGORIES, AgentCategory } from '@/types'
import {
  Shield,
  Home,
  Plane,
  ScrollText,
  Scale,
  Calculator,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

const categoryIcons: Record<AgentCategory, React.ReactNode> = {
  insurance: <Shield className="h-6 w-6" />,
  real_estate: <Home className="h-6 w-6" />,
  travel: <Plane className="h-6 w-6" />,
  inheritance: <ScrollText className="h-6 w-6" />,
  legal: <Scale className="h-6 w-6" />,
  tax: <Calculator className="h-6 w-6" />,
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .limit(6)

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <Badge variant="secondary" className="px-4 py-1">
            <Sparkles className="mr-2 h-4 w-4" />
            専門家AIにすぐ相談
          </Badge>
          <h1 className="font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            AIエージェント
            <br className="hidden sm:inline" />
            マーケットプレイス
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            保険、不動産、旅行計画、遺産相続、法律など、
            専門分野に特化したAIエージェントに即座に相談できます。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/agents/travel">旅行計画を作成</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/agents">
                エージェントを探す
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/signup">無料で始める</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            専門カテゴリ
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            各分野のエキスパートAIがあなたの疑問や課題を解決します
          </p>
        </div>

        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          {(Object.entries(AGENT_CATEGORIES) as [AgentCategory, string][]).map(
            ([key, label]) => (
              <Link key={key} href={`/agents?category=${key}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {categoryIcons[key]}
                      </div>
                      <CardTitle className="text-lg">{label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {key === 'insurance' && '保険の選び方、見直し、比較など'}
                      {key === 'real_estate' && '物件探し、契約手続き、投資相談など'}
                      {key === 'travel' && '旅程作成、予約サポート、現地情報など'}
                      {key === 'inheritance' && '相続手続き、遺言書作成サポートなど'}
                      {key === 'legal' && '契約書確認、法的トラブル相談など'}
                      {key === 'tax' && '確定申告、節税対策のアドバイスなど'}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            )
          )}
        </div>
      </section>

      {/* Featured Agents Section */}
      {agents && agents.length > 0 && (
        <section className="container space-y-6 py-8 md:py-12 lg:py-24 bg-muted/50">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              人気のエージェント
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              多くのユーザーに利用されている信頼のエージェント
            </p>
          </div>

          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            {agents.map((agent: Agent) => (
              <Link key={agent.id} href={`/agents/${agent.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {categoryIcons[agent.category as AgentCategory]}
                      </div>
                      <Badge variant="secondary">
                        {AGENT_CATEGORIES[agent.category as AgentCategory]}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{agent.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      ¥{agent.price_per_message} / メッセージ
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mx-auto text-center">
            <Button asChild variant="outline">
              <Link href="/agents">
                すべてのエージェントを見る
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="container py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            今すぐ始めましょう
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            無料登録で、すぐにAIエージェントとの会話を始められます
          </p>
          <Button asChild size="lg">
            <Link href="/auth/signup">
              無料アカウントを作成
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
