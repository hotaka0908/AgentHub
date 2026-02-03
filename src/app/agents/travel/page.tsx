import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { filterSeedAgents } from '@/lib/seed-agents'

export default async function TravelAgentStartPage() {
  let agentId: string | null = null

  try {
    const supabase = await createServerSupabaseClient()

    const { data: agent } = await supabase
      .from('agents')
      .select('id, name')
      .eq('category', 'travel')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (agent?.id) {
      agentId = agent.id
    }
  } catch (error) {
    console.error('Failed to load travel agent from Supabase:', error)
  }

  if (!agentId) {
    const fallback = filterSeedAgents({ category: 'travel' })
    agentId = fallback[0]?.id ?? null
  }

  if (agentId) {
    redirect(`/agents/${agentId}/chat`)
  }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-xl rounded-2xl border bg-background p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">旅行エージェントが見つかりませんでした</h1>
        <p className="text-sm text-muted-foreground">
          現在、旅行カテゴリのエージェントが登録されていないか無効化されています。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/agents">全エージェントを見る</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/agents?category=travel">旅行カテゴリを見る</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
