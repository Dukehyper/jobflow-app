import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// PUT /api/interview-prep/[id]
// Update the answer (or question text) for a specific interview prep item.
// Body: { answer?: string | null; question?: string }
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest, { params }: RouteContext) {
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

    const { id } = await params

    let body: { answer?: unknown; question?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Build safe update payload
    const updatePayload: Record<string, unknown> = {}

    if ('answer' in body) {
      updatePayload.answer =
        typeof body.answer === 'string' ? body.answer : null
    }
    if (typeof body.question === 'string' && body.question.trim()) {
      updatePayload.question = body.question.trim()
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { data: null, error: 'No valid fields provided for update' },
        { status: 400 }
      )
    }

    // Verify the row belongs to this user before updating
    const { data: existing, error: fetchError } = await supabase
      .from('interview_prep')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { data: null, error: 'Interview prep item not found' },
        { status: 404 }
      )
    }

    const { data: updated, error: updateError } = await supabase
      .from('interview_prep')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !updated) {
      return NextResponse.json(
        { data: null, error: 'Failed to update interview prep item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updated, error: null })
  } catch (err) {
    console.error('[PUT /api/interview-prep/[id]] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/interview-prep/[id]
// Delete a specific interview prep question.
// ---------------------------------------------------------------------------
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
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

    const { id } = await params

    // Verify ownership before deleting
    const { data: existing, error: fetchError } = await supabase
      .from('interview_prep')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { data: null, error: 'Interview prep item not found' },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase
      .from('interview_prep')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { data: null, error: 'Failed to delete interview prep item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { id }, error: null })
  } catch (err) {
    console.error('[DELETE /api/interview-prep/[id]] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
