import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDuplicateHash } from '@/lib/utils/duplicate-hash'
import type { CVType, JobStatus } from '@/types'

// ---------------------------------------------------------------------------
// GET /api/jobs
// Query params: ?status=saved|applied|interview|rejected
// Returns all jobs for the authenticated user, optionally filtered by status.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verify auth
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

    // 2. Parse optional status filter
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')

    const validStatuses: JobStatus[] = ['saved', 'applied', 'interview', 'rejected']

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (statusParam && validStatuses.includes(statusParam as JobStatus)) {
      query = query.eq('status', statusParam as JobStatus)
    }

    const { data: jobs, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json(
        { data: null, error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: jobs ?? [], error: null })
  } catch (err) {
    console.error('[GET /api/jobs] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// POST /api/jobs
// Body: { title, company, description?, source_url?, cv_type?, notes? }
// Creates a new job, checking for duplicate source_url first.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verify auth
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

    // 2. Parse + validate body
    let body: {
      title?: unknown
      company?: unknown
      description?: unknown
      source_url?: unknown
      cv_type?: unknown
      notes?: unknown
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { title, company, description, source_url, cv_type, notes } = body

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { data: null, error: 'title is required' },
        { status: 400 }
      )
    }

    if (typeof company !== 'string' || !company.trim()) {
      return NextResponse.json(
        { data: null, error: 'company is required' },
        { status: 400 }
      )
    }

    const validCvTypes: CVType[] = ['career', 'temp']
    if (cv_type !== undefined && cv_type !== null && !validCvTypes.includes(cv_type as CVType)) {
      return NextResponse.json(
        { data: null, error: 'cv_type must be "career" or "temp"' },
        { status: 400 }
      )
    }

    // 3. Compute duplicate hash if source_url is provided
    let duplicateHash: string | null = null
    if (typeof source_url === 'string' && source_url.trim()) {
      duplicateHash = generateDuplicateHash(source_url.trim())

      // Check if this hash already exists for the user
      const { data: existingJob, error: dupError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('duplicate_hash', duplicateHash)
        .maybeSingle()

      if (dupError) {
        return NextResponse.json(
          { data: null, error: 'Failed to check for duplicates' },
          { status: 500 }
        )
      }

      if (existingJob) {
        return NextResponse.json(
          {
            data: null,
            error: 'DUPLICATE',
            existingJob,
          },
          { status: 409 }
        )
      }
    }

    // 4. Insert new job
    const { data: newJob, error: insertError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        title: title.trim(),
        company: company.trim(),
        description: typeof description === 'string' ? description : null,
        source_url: typeof source_url === 'string' && source_url.trim() ? source_url.trim() : null,
        cv_type: cv_type !== undefined && cv_type !== null ? (cv_type as CVType) : null,
        notes: typeof notes === 'string' ? notes : null,
        duplicate_hash: duplicateHash,
        status: 'saved',
        cv_manually_edited: false,
        cover_letter_manually_edited: false,
      })
      .select()
      .single()

    if (insertError || !newJob) {
      return NextResponse.json(
        { data: null, error: 'Failed to create job' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: newJob, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/jobs] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
