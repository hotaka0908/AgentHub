import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')

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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(agents)
  } catch (error) {
    console.error('Agents API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
