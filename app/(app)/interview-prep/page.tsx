import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { InterviewPrepClient } from '@/components/interview/interview-prep-client'
import type { Job } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Interview Prep — JOBFLOW',
  description: 'Generate and practice interview questions for your job applications.',
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
      console.error('[InterviewPrep] Failed to fetch jobs:', error.message)
      return []
    }

    return (data ?? []) as Job[]
  } catch (err) {
    console.error('[InterviewPrep] Unhandled error fetching jobs:', err)
    return []
  }
}

export default async function InterviewPrepPage() {
  const jobs = await fetchJobs()

  return (
    <Suspense
      fallback={
        <div className="page-container">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-56 bg-[#18181B] rounded-lg" />
            <div className="h-12 w-full bg-[#111113] rounded-xl" />
            <div className="flex gap-2">
              <div className="h-10 w-28 bg-[#111113] rounded-lg" />
              <div className="h-10 w-32 bg-[#111113] rounded-lg" />
              <div className="h-10 w-28 bg-[#111113] rounded-lg" />
            </div>
            <div className="h-48 w-full bg-[#111113] rounded-xl" />
            <div className="h-48 w-full bg-[#111113] rounded-xl" />
          </div>
        </div>
      }
    >
      <InterviewPrepClient jobs={jobs} />
    </Suspense>
  )
}
