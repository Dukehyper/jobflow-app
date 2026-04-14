import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FollowUpsClient } from '@/components/follow-ups/follow-ups-client'
import type { FollowUp } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Follow-ups — AI Job Portal',
  description: 'Manage and send follow-up emails for your job applications.',
}

async function fetchFollowUps(): Promise<FollowUp[]> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect('/login')
    }

    const { data, error } = await supabase
      .from('follow_ups')
      .select('*, jobs(id, title, company, applied_at)')
      .eq('user_id', user.id)
      .order('due_at')

    if (error) {
      console.error('[FollowUpsPage] Failed to fetch follow-ups:', error.message)
      return []
    }

    return (data ?? []) as FollowUp[]
  } catch (err) {
    console.error('[FollowUpsPage] Unhandled error:', err)
    return []
  }
}

export default async function FollowUpsPage() {
  const followUps = await fetchFollowUps()

  return <FollowUpsClient initialFollowUps={followUps} />
}
