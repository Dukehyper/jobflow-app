import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CVType, JobStatus } from '@/types'

type RouteContext = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// GET /api/jobs/[id]
// Fetches a single job with its interview_prep rows and follow_ups.
// ---------------------------------------------------------------------------
export async function GET(_request: NextRequest, { params }: RouteContext) {
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

    const { id } = await params

    // 2. Fetch job + related data in parallel
    const [jobRes, interviewRes, followUpRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('interview_prep')
        .select('*')
        .eq('job_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('follow_ups')
        .select('*')
        .eq('job_id', id)
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    if (jobRes.error || !jobRes.data) {
      return NextResponse.json(
        { data: null, error: 'Job not found' },
        { status: 404 }
      )
    }

    const result = {
      ...jobRes.data,
      interview_prep: interviewRes.data ?? [],
      follow_up: followUpRes.data ?? null,
    }

    return NextResponse.json({ data: result, error: null })
  } catch (err) {
    console.error('[GET /api/jobs/[id]] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// PUT /api/jobs/[id]
// Updates allowed job fields. Body may contain any subset of:
//   title, company, description, status, cv_type, notes,
//   generated_cv_edited, generated_cover_letter_edited,
//   cv_manually_edited, cover_letter_manually_edited
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest, { params }: RouteContext) {
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

    const { id } = await params

    // 2. Parse body
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // 3. Verify job exists and belongs to user
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingJob) {
      return NextResponse.json(
        { data: null, error: 'Job not found' },
        { status: 404 }
      )
    }

    // 4. Build safe update payload — only allow whitelisted fields
    const validStatuses: JobStatus[] = ['saved', 'applied', 'interview', 'rejected']
    const validCvTypes: CVType[] = ['career', 'temp']

    const updatePayload: Record<string, unknown> = {}

    if (typeof body.title === 'string' && body.title.trim()) {
      updatePayload.title = body.title.trim()
    }
    if (typeof body.company === 'string' && body.company.trim()) {
      updatePayload.company = body.company.trim()
    }
    if ('description' in body) {
      updatePayload.description = typeof body.description === 'string' ? body.description : null
    }
    if (typeof body.status === 'string' && validStatuses.includes(body.status as JobStatus)) {
      updatePayload.status = body.status as JobStatus
      // If marking as applied and no applied_at, set it now
      if (body.status === 'applied') {
        updatePayload.applied_at = new Date().toISOString()
      }
    }
    if (
      typeof body.cv_type === 'string' &&
      validCvTypes.includes(body.cv_type as CVType)
    ) {
      updatePayload.cv_type = body.cv_type as CVType
    } else if (body.cv_type === null) {
      updatePayload.cv_type = null
    }
    if ('notes' in body) {
      updatePayload.notes = typeof body.notes === 'string' ? body.notes : null
    }
    if (typeof body.generated_cv_edited === 'string') {
      updatePayload.generated_cv_edited = body.generated_cv_edited
    }
    if (typeof body.generated_cover_letter_edited === 'string') {
      updatePayload.generated_cover_letter_edited = body.generated_cover_letter_edited
    }
    if (typeof body.cv_manually_edited === 'boolean') {
      updatePayload.cv_manually_edited = body.cv_manually_edited
    }
    if (typeof body.cover_letter_manually_edited === 'boolean') {
      updatePayload.cover_letter_manually_edited = body.cover_letter_manually_edited
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { data: null, error: 'No valid fields provided for update' },
        { status: 400 }
      )
    }

    // 5. Perform update
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !updatedJob) {
      return NextResponse.json(
        { data: null, error: 'Failed to update job' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedJob, error: null })
  } catch (err) {
    console.error('[PUT /api/jobs/[id]] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/jobs/[id]
// Deletes a job and all its related rows (cascade handled by DB foreign keys).
// ---------------------------------------------------------------------------
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
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

    const { id } = await params

    // 2. Verify job exists and belongs to user before deleting
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingJob) {
      return NextResponse.json(
        { data: null, error: 'Job not found' },
        { status: 404 }
      )
    }

    // 3. Delete the job
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { data: null, error: 'Failed to delete job' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { id }, error: null })
  } catch (err) {
    console.error('[DELETE /api/jobs/[id]] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
