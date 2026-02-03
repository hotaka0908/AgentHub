'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Agent, AGENT_CATEGORIES, AgentCategory } from '@/types'
import { formatPrice } from '@/lib/utils'
import {
  Shield,
  Home,
  Plane,
  ScrollText,
  Scale,
  Calculator,
  MessageCircle,
} from 'lucide-react'

const categoryIcons: Record<AgentCategory, React.ReactNode> = {
  insurance: <Shield className="h-6 w-6" />,
  real_estate: <Home className="h-6 w-6" />,
  travel: <Plane className="h-6 w-6" />,
  inheritance: <ScrollText className="h-6 w-6" />,
  legal: <Scale className="h-6 w-6" />,
  tax: <Calculator className="h-6 w-6" />,
}

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const router = useRouter()

  return (
    <Card
      className="hover:border-primary transition-colors h-full flex flex-col cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/agents/${agent.id}/chat`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          router.push(`/agents/${agent.id}/chat`)
        }
      }}
    >
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
      <CardContent className="flex-1 flex flex-col justify-end">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {formatPrice(agent.price_per_message)} / メッセージ
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                router.push(`/agents/${agent.id}/chat`)
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              相談する
            </Button>
            <Link
              href={`/agents/${agent.id}`}
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={(event) => event.stopPropagation()}
            >
              詳細
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
