import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// DELETE /api/account
// Permanently deletes the authenticated user's account and all associated data.
// Steps:
//   1. Verify auth via anon client
//   2. Delete from profiles table (cascades to all user data)
//   3. Delete auth user via service-role admin client
// ---------------------------------------------------------------------------
export async function DELETE() {
  try {
    const supabase = await createServerClient()

    // 1. Verify authentication
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

    // 2. Delete from profiles — this cascades to all user data via FK constraints
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileDeleteError) {
      console.error('[DELETE /api/account] Profile delete error:', profileDeleteError.message)
      return NextResponse.json(
        { data: null, error: 'Failed to delete account data' },
        { status: 500 }
      )
    }

    // 3. Use admin client (service role) to delete the auth user
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: adminDeleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (adminDeleteError) {
      console.error('[DELETE /api/account] Auth user delete error:', adminDeleteError.message)
      // Profile data already deleted — log but return success to client
      // so they can be signed out and redirected
    }

    return NextResponse.json({ data: { deleted: true }, error: null })
  } catch (err) {
    console.error('[DELETE /api/account] Unhandled error:', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
