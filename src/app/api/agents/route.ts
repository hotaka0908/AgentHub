import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { filterSeedAgents } from '@/lib/seed-agents'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    try {
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

      const { data: agents, error } = await query.order('created_at', {
        ascending: false,
      })

      if (!error && agents && agents.length > 0) {
        return NextResponse.json(agents)
      }
    } catch (error) {
      console.error('Agents API error:', error)
    }

    const fallbackAgents = filterSeedAgents({ category, search })
    return NextResponse.json(fallbackAgents)
  } catch (error) {
    console.error('Agents API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
