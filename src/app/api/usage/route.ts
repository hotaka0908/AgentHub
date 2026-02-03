import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    let query = supabase
      .from('usage_records')
      .select(`
        *,
        agents (name, category)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: records, error } = await query.limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate totals
    const totalCost = records?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0
    const totalTokens = records?.reduce((sum, r) => sum + (r.tokens_used || 0), 0) || 0

    return NextResponse.json({
      records,
      summary: {
        totalCost,
        totalTokens,
        count: records?.length || 0,
      },
    })
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { agentId, tokensUsed, cost } = await request.json()

    const { data, error } = await supabase
      .from('usage_records')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        tokens_used: tokensUsed,
        cost,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
