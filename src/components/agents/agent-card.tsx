'use client'

import Link from 'next/link'
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
  return (
    <Card className="hover:border-primary transition-colors h-full flex flex-col">
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
          <Button asChild size="sm">
            <Link href={`/agents/${agent.id}`}>
              <MessageCircle className="mr-2 h-4 w-4" />
              相談する
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
