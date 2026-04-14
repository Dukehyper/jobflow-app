import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// PUT /api/follow-ups/[id]
// Marks a follow-up as sent: sets status='sent' and sent_at=now.
// ---------------------------------------------------------------------------
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    if (!id) {
      return NextResponse.json(
        { data: null, error: 'Missing follow-up id' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('follow_ups')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id) // ensure ownership
      .select()
      .single()

    if (error) {
      console.error('[PUT /api/follow-ups/[id]] Supabase error:', error.message)
      return NextResponse.json(
        { data: null, error: 'Failed to update follow-up' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[PUT /api/follow-ups/[id]] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
