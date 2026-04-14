import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, CV, CVType } from '@/types'

// ---------------------------------------------------------------------------
// GET /api/cvs
// Returns both CVs (career + temp) for the authenticated user
// ---------------------------------------------------------------------------
export async function GET(): Promise<NextResponse<ApiResponse<CV[]>>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .in('type', ['career', 'temp'])
      .order('type', { ascending: true })

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [], error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/cvs
// Create or update (upsert) a CV by user_id + type
// Body: { type: CVType; template_id?: string; base_content?: object }
// ---------------------------------------------------------------------------
interface PostBody {
  type: CVType
  template_id?: string
  base_content?: Record<string, unknown>
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CV>>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    let body: PostBody
    try {
      body = (await request.json()) as PostBody
    } catch {
      return NextResponse.json({ data: null, error: 'Invalid JSON body' }, { status: 400 })
    }

    const { type, template_id, base_content } = body

    if (type !== 'career' && type !== 'temp') {
      return NextResponse.json(
        { data: null, error: 'type must be "career" or "temp"' },
        { status: 400 }
      )
    }

    // Build update payload — only include fields provided in the body
    const upsertPayload: Record<string, unknown> = {
      user_id: user.id,
      type,
      updated_at: new Date().toISOString(),
    }
    if (template_id !== undefined) upsertPayload.template_id = template_id
    if (base_content !== undefined) upsertPayload.base_content = base_content

    const { data, error } = await supabase
      .from('cvs')
      .upsert(upsertPayload, { onConflict: 'user_id,type' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
