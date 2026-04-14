import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CollectionStatus } from '@/types'

type RouteContext = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// PUT /api/collection/[id]
// Body: { title?, company?, notes?, status? }
// Updates a collection item belonging to the authenticated user.
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

    let body: {
      title?: unknown
      company?: unknown
      notes?: unknown
      status?: unknown
    }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { title, company, notes, status } = body

    const validStatuses: CollectionStatus[] = ['saved', 'shortlisted']

    const updates: Record<string, string | null> = {}

    if (typeof title === 'string' && title.trim()) {
      updates.title = title.trim()
    }
    if (company !== undefined) {
      updates.company = typeof company === 'string' && company.trim() ? company.trim() : null
    }
    if (notes !== undefined) {
      updates.notes = typeof notes === 'string' && notes.trim() ? notes.trim() : null
    }
    if (typeof status === 'string' && validStatuses.includes(status as CollectionStatus)) {
      updates.status = status
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { data: null, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('collection')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !updatedItem) {
      console.error('[PUT /api/collection/[id]] Supabase error:', updateError)
      return NextResponse.json(
        { data: null, error: 'Failed to update collection item' },
        { status: updateError?.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json({ data: updatedItem, error: null })
  } catch (err) {
    console.error('[PUT /api/collection/[id]] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/collection/[id]
// Deletes a collection item belonging to the authenticated user.
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

    const { error: deleteError } = await supabase
      .from('collection')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[DELETE /api/collection/[id]] Supabase error:', deleteError)
      return NextResponse.json(
        { data: null, error: 'Failed to delete collection item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { id }, error: null })
  } catch (err) {
    console.error('[DELETE /api/collection/[id]] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
