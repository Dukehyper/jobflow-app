import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateText, MAX_TOKENS_DEFAULT } from '@/lib/ai/client'
import { buildFollowUpPrompt } from '@/lib/anthropic/prompts'
import { createClient } from '@/lib/supabase/server'
import { getProfileCompleteness } from '@/lib/utils/profile-completeness'
import type { MasterProfile } from '@/types'

// ---------------------------------------------------------------------------
// Shared helper: assemble a full MasterProfile for a given user
// ---------------------------------------------------------------------------
async function fetchMasterProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<MasterProfile> {
  const [profileRes, expRes, skillsRes, eduRes, projRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('experiences').select('*').eq('user_id', userId),
    supabase.from('skills').select('*').eq('user_id', userId),
    supabase.from('education').select('*').eq('user_id', userId),
    supabase.from('projects').select('*').eq('user_id', userId),
  ])
  return {
    profile: profileRes.data,
    experiences: expRes.data ?? [],
    skills: skillsRes.data ?? [],
    education: eduRes.data ?? [],
    projects: projRes.data ?? [],
  }
}

// ---------------------------------------------------------------------------
// POST /api/ai/generate-followup
// Body: { job_id: string }
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
    let body: { job_id?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { job_id } = body

    if (typeof job_id !== 'string' || !job_id.trim()) {
      return NextResponse.json(
        { data: null, error: 'job_id is required' },
        { status: 400 }
      )
    }

    // 3. Fetch job — verify ownership and status
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { data: null, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Job must be in 'applied' status or later (applied, interview)
    const eligibleStatuses = ['applied', 'interview']
    if (!eligibleStatuses.includes(job.status)) {
      return NextResponse.json(
        {
          data: null,
          error: 'Follow-up emails can only be generated for jobs with status "applied" or "interview"',
        },
        { status: 400 }
      )
    }

    // 4. Fetch MasterProfile
    const masterProfile = await fetchMasterProfile(supabase, user.id)

    // 5. Check profile completeness
    const completeness = getProfileCompleteness(masterProfile)
    if (completeness.score < 60) {
      return NextResponse.json(
        {
          data: null,
          error: `Complete your profile first (currently ${completeness.score}%)`,
        },
        { status: 400 }
      )
    }

    // 6. Build prompt + call Anthropic
    const prompt = buildFollowUpPrompt(masterProfile, {
      title: job.title,
      company: job.company,
      applied_at: job.applied_at,
    })

    const generatedEmail = await generateText(prompt, MAX_TOKENS_DEFAULT)

    // 7. Upsert into follow_ups table (due 5 days from now)
    const dueAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()

    const { error: upsertError } = await supabase
      .from('follow_ups')
      .upsert(
        {
          job_id,
          user_id: user.id,
          generated_email: generatedEmail,
          status: 'pending',
          due_at: dueAt,
        },
        { onConflict: 'job_id' }
      )

    if (upsertError) {
      return NextResponse.json(
        { data: null, error: 'Failed to save follow-up email' },
        { status: 500 }
      )
    }

    // 8. Return result
    return NextResponse.json({ data: generatedEmail, error: null })
  } catch (err) {
    console.error('[generate-followup] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
