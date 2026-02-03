import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AgentList } from '@/components/agents/agent-list'
import { AgentFilter } from '@/components/agents/agent-filter'
import { Agent } from '@/types'

interface AgentsPageProps {
  searchParams: { category?: string; search?: string }
}

async function AgentListWrapper({ category, search }: { category?: string; search?: string }) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data: agents } = await query.order('created_at', { ascending: false })

  return <AgentList agents={(agents as Agent[]) || []} />
}

export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  const params = await searchParams

  return (
    <div className="container py-8">
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">エージェント一覧</h1>
          <p className="text-muted-foreground">
            専門分野に特化したAIエージェントを探して、すぐに相談を始められます
          </p>
        </div>

        <AgentFilter />

        <Suspense fallback={<div className="py-12 text-center">読み込み中...</div>}>
          <AgentListWrapper category={params.category} search={params.search} />
        </Suspense>
      </div>
    </div>
  )
}
