import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// GET /api/follow-ups
// Returns all follow-ups for the authenticated user with joined job data.
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorised' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('follow_ups')
      .select('*, jobs(title, company, applied_at)')
      .eq('user_id', user.id)
      .order('due_at')

    if (error) {
      console.error('[GET /api/follow-ups] Supabase error:', error.message)
      return NextResponse.json(
        { data: null, error: 'Failed to fetch follow-ups' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data ?? [], error: null })
  } catch (err) {
    console.error('[GET /api/follow-ups] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
