import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateText, MAX_TOKENS_DEFAULT } from '@/lib/ai/client'
import { buildInterviewQuestionsPrompt } from '@/lib/anthropic/prompts'
import { createClient } from '@/lib/supabase/server'
import { getProfileCompleteness } from '@/lib/utils/profile-completeness'
import type { MasterProfile, InterviewRound } from '@/types'

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
// POST /api/ai/generate-questions
// Body: { job_id: string; round: InterviewRound }
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
    let body: { job_id?: unknown; round?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { job_id, round } = body

    if (typeof job_id !== 'string' || !job_id.trim()) {
      return NextResponse.json(
        { data: null, error: 'job_id is required' },
        { status: 400 }
      )
    }

    const validRounds: InterviewRound[] = ['basic', 'intermediate', 'advanced']
    if (typeof round !== 'string' || !validRounds.includes(round as InterviewRound)) {
      return NextResponse.json(
        { data: null, error: 'round must be "basic", "intermediate", or "advanced"' },
        { status: 400 }
      )
    }

    const validatedRound = round as InterviewRound

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
    const prompt = buildInterviewQuestionsPrompt(
      masterProfile,
      job.description ?? '',
      validatedRound
    )

    const rawText = await generateText(prompt, MAX_TOKENS_DEFAULT)

    // 7. Parse JSON array response
    let questions: string[]
    try {
      // Strip any markdown code fences the model might wrap around JSON
      const raw = rawText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '')
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed) || !parsed.every((q) => typeof q === 'string')) {
        throw new Error('Not a string array')
      }
      questions = parsed
    } catch {
      return NextResponse.json(
        { data: null, error: 'AI returned an invalid question format' },
        { status: 500 }
      )
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { data: null, error: 'AI returned no questions' },
        { status: 500 }
      )
    }

    // 8. Insert each question as a row in interview_prep
    const rows = questions.map((question) => ({
      job_id,
      user_id: user.id,
      round: validatedRound,
      question,
      answer: null,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('interview_prep')
      .insert(rows)
      .select()

    if (insertError) {
      return NextResponse.json(
        { data: null, error: 'Failed to save interview questions' },
        { status: 500 }
      )
    }

    // 9. Return result
    return NextResponse.json({ data: inserted, error: null })
  } catch (err) {
    console.error('[generate-questions] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
