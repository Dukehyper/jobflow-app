import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateText, MAX_TOKENS_DEFAULT } from '@/lib/ai/client'
import { buildCoverLetterPrompt } from '@/lib/anthropic/prompts'
import { createClient } from '@/lib/supabase/server'
import { getProfileCompleteness } from '@/lib/utils/profile-completeness'
import type { MasterProfile, CVType } from '@/types'

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
// POST /api/ai/generate-cover-letter
// Body: { job_id: string; cv_type: CVType }
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
    let body: { job_id?: unknown; cv_type?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { job_id, cv_type } = body

    if (typeof job_id !== 'string' || !job_id.trim()) {
      return NextResponse.json(
        { data: null, error: 'job_id is required' },
        { status: 400 }
      )
    }

    if (cv_type !== 'career' && cv_type !== 'temp') {
      return NextResponse.json(
        { data: null, error: 'cv_type must be "career" or "temp"' },
        { status: 400 }
      )
    }

    const validatedCvType = cv_type as CVType

    // 3. Fetch job — verify ownership
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
    const prompt = buildCoverLetterPrompt(
      masterProfile,
      job.description ?? '',
      validatedCvType
    )

    const generatedCoverLetter = await generateText(prompt, MAX_TOKENS_DEFAULT)

    // 7. Persist to database
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        generated_cover_letter: generatedCoverLetter,
        cover_letter_manually_edited: false,
      })
      .eq('id', job_id)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json(
        { data: null, error: 'Failed to save generated cover letter' },
        { status: 500 }
      )
    }

    // 8. Return result
    return NextResponse.json({ data: generatedCoverLetter, error: null })
  } catch (err) {
    console.error('[generate-cover-letter] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
