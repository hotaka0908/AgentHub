'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AGENT_CATEGORIES, AgentCategory } from '@/types'
import { Search } from 'lucide-react'

export function AgentFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get('category') || 'all'
  const currentSearch = searchParams.get('search') || ''

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/agents?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="エージェントを検索..."
          className="pl-10"
          defaultValue={currentSearch}
          onChange={(e) => {
            const value = e.target.value
            if (value.length === 0 || value.length >= 2) {
              updateParams('search', value)
            }
          }}
        />
      </div>
      <Select value={currentCategory} onValueChange={(value) => updateParams('category', value)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="カテゴリを選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのカテゴリ</SelectItem>
          {(Object.entries(AGENT_CATEGORIES) as [AgentCategory, string][]).map(
            ([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
