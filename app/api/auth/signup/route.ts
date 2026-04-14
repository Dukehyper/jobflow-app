import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, full_name } = await request.json() as {
      email: string
      password: string
      full_name: string
    }

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use admin/service-role client — bypasses email verification entirely
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // no verification email sent
      user_metadata: { full_name },
    })

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        return NextResponse.json({ error: 'ALREADY_EXISTS' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: { user_id: data.user.id }, error: null })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
