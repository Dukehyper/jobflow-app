import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TrackerClient } from '@/components/tracker/tracker-client'
import type { Job } from '@/types'

// Force dynamic rendering so search params are always fresh
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Job Tracker — AI Job Portal',
  description: 'Track and manage all your job applications in one place.',
}

async function fetchJobs(): Promise<Job[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Tracker] Failed to fetch jobs:', error.message)
      return []
    }

    return (data ?? []) as Job[]
  } catch (err) {
    console.error('[Tracker] Unhandled error fetching jobs:', err)
    return []
  }
}

export default async function TrackerPage() {
  const jobs = await fetchJobs()

  return (
    <Suspense
      fallback={
        <div className="page-container">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 bg-[#18181B] rounded-lg" />
            <div className="h-10 w-full bg-[#111113] rounded-xl" />
            <div className="h-64 w-full bg-[#111113] rounded-xl" />
          </div>
        </div>
      }
    >
      <TrackerClient initialJobs={jobs} />
    </Suspense>
  )
}
