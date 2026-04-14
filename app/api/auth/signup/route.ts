import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string; full_name?: string }
    const { email, password, full_name } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      console.error('[signup] Missing env vars:', { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey })
      return NextResponse.json({ error: 'Server misconfigured — contact admin' }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (error) {
      console.error('[signup] Supabase admin error:', error.message, error.status)
      const msg = error.message.toLowerCase()
      if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
        return NextResponse.json({ error: 'ALREADY_EXISTS' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: { user_id: data.user.id }, error: null })
  } catch (err) {
    console.error('[signup] Unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
