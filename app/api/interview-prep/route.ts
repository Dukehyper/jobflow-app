import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { InterviewRound } from '@/types'

// ---------------------------------------------------------------------------
// GET /api/interview-prep?job_id=xxx
// Fetch all interview prep questions for a specific job.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId || !jobId.trim()) {
      return NextResponse.json(
        { data: null, error: 'job_id query param is required' },
        { status: 400 }
      )
    }

    // Verify the job belongs to this user (or allow null for standalone mode)
    if (jobId !== 'standalone') {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single()

      if (jobError || !job) {
        return NextResponse.json(
          { data: null, error: 'Job not found' },
          { status: 404 }
        )
      }
    }

    const query = supabase
      .from('interview_prep')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    const { data, error: fetchError } =
      jobId === 'standalone'
        ? await query.is('job_id', null)
        : await query.eq('job_id', jobId)

    if (fetchError) {
      return NextResponse.json(
        { data: null, error: 'Failed to fetch interview prep' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data ?? [], error: null })
  } catch (err) {
    console.error('[GET /api/interview-prep] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// POST /api/interview-prep
// Create a standalone (no-job) interview prep question.
// Body: { round: InterviewRound; question: string }
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

    let body: { round?: unknown; question?: unknown; questions?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const validRounds: InterviewRound[] = ['basic', 'intermediate', 'advanced']
    if (typeof body.round !== 'string' || !validRounds.includes(body.round as InterviewRound)) {
      return NextResponse.json(
        { data: null, error: 'round must be "basic", "intermediate", or "advanced"' },
        { status: 400 }
      )
    }

    // Support inserting multiple questions at once
    const questionsInput = Array.isArray(body.questions)
      ? body.questions
      : typeof body.question === 'string'
      ? [body.question]
      : []

    if (questionsInput.length === 0) {
      return NextResponse.json(
        { data: null, error: 'question or questions array is required' },
        { status: 400 }
      )
    }

    const rows = questionsInput
      .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
      .map((question) => ({
        job_id: null,
        user_id: user.id,
        round: body.round as InterviewRound,
        question: question.trim(),
        answer: null,
      }))

    const { data: inserted, error: insertError } = await supabase
      .from('interview_prep')
      .insert(rows)
      .select()

    if (insertError) {
      return NextResponse.json(
        { data: null, error: 'Failed to create interview prep questions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: inserted, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/interview-prep] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
