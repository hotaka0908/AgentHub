export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  stripe_customer_id: string | null
  created_at: string
}

export interface Agent {
  id: string
  name: string
  description: string
  category: string
  icon_url: string | null
  system_prompt: string
  price_per_message: number
  is_active: boolean
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  agent_id: string
  title: string
  created_at: string
  updated_at: string
  agent?: Agent
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  tokens_used: number
  created_at: string
}

export interface UsageRecord {
  id: string
  user_id: string
  agent_id: string
  message_id: string
  tokens_used: number
  cost: number
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  plan: 'free' | 'basic' | 'pro'
  status: 'active' | 'canceled' | 'past_due'
  current_period_end: string
}

export type AgentCategory =
  | 'insurance'
  | 'real_estate'
  | 'travel'
  | 'inheritance'
  | 'legal'
  | 'tax'

export const AGENT_CATEGORIES: Record<AgentCategory, string> = {
  insurance: '保険',
  real_estate: '不動産',
  travel: '旅行',
  inheritance: '相続・遺言',
  legal: '法律',
  tax: '税務',
}
