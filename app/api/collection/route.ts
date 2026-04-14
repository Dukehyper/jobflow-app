import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CollectionStatus } from '@/types'

// ---------------------------------------------------------------------------
// GET /api/collection
// Returns all collection items for the authenticated user.
// ---------------------------------------------------------------------------
export async function GET(_request: NextRequest) {
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

    const { data: items, error: fetchError } = await supabase
      .from('collection')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })

    if (fetchError) {
      console.error('[GET /api/collection] Supabase error:', fetchError)
      return NextResponse.json(
        { data: null, error: 'Failed to fetch collection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: items ?? [], error: null })
  } catch (err) {
    console.error('[GET /api/collection] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// POST /api/collection
// Body: { url?, title, company?, notes?, status? }
// Creates a new collection item.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
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

    let body: {
      url?: unknown
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

    const { url, title, company, notes, status } = body

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { data: null, error: 'title is required' },
        { status: 400 }
      )
    }

    const validStatuses: CollectionStatus[] = ['saved', 'shortlisted']
    const resolvedStatus: CollectionStatus =
      typeof status === 'string' && validStatuses.includes(status as CollectionStatus)
        ? (status as CollectionStatus)
        : 'saved'

    const { data: newItem, error: insertError } = await supabase
      .from('collection')
      .insert({
        user_id: user.id,
        url: typeof url === 'string' && url.trim() ? url.trim() : null,
        title: title.trim(),
        company: typeof company === 'string' && company.trim() ? company.trim() : null,
        notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
        status: resolvedStatus,
        saved_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError || !newItem) {
      console.error('[POST /api/collection] Supabase error:', insertError)
      return NextResponse.json(
        { data: null, error: 'Failed to create collection item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: newItem, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/collection] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
