import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JobDetailClient } from '@/components/job-detail/job-detail-client'
import type { Job, InterviewPrep, FollowUp } from '@/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { title: 'Job Detail — AI Job Portal' }

    const { data } = await supabase
      .from('jobs')
      .select('title, company')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!data) return { title: 'Job Detail — AI Job Portal' }
    return { title: `${data.title} at ${data.company} — AI Job Portal` }
  } catch {
    return { title: 'Job Detail — AI Job Portal' }
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    notFound()
  }

  const [jobRes, prepRes, followupRes] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase
      .from('interview_prep')
      .select('*')
      .eq('job_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('follow_ups').select('*').eq('job_id', id).maybeSingle(),
  ])

  if (jobRes.error || !jobRes.data) {
    notFound()
  }

  const job = jobRes.data as Job
  const interviewPrep = (prepRes.data ?? []) as InterviewPrep[]
  const followUp = (followupRes.data ?? null) as FollowUp | null

  return (
    <JobDetailClient
      job={job}
      initialInterviewPrep={interviewPrep}
      initialFollowUp={followUp}
    />
  )
}
