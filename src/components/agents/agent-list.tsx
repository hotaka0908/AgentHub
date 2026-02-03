'use client'

import { Agent } from '@/types'
import { AgentCard } from './agent-card'

interface AgentListProps {
  agents: Agent[]
}

export function AgentList({ agents }: AgentListProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          該当するエージェントが見つかりませんでした
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  )
}
