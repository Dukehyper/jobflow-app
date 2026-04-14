import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileCompleteness } from '@/lib/utils/profile-completeness'
import type { Job, FollowUp, CollectionItem, MasterProfile } from '@/types'

import { StatsGrid } from '@/components/dashboard/stats-grid'
import { RecentJobs } from '@/components/dashboard/recent-jobs'
import { PendingFollowUpsWidget } from '@/components/dashboard/pending-followups-widget'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { ProfileBanner } from '@/components/dashboard/profile-banner'

export const dynamic = 'force-dynamic'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(name: string | null): string {
  // Uses UTC hours — acceptable for a server-side greeting approximation
  const hour = new Date().getUTCHours()
  const timeOfDay =
    hour >= 5 && hour < 12
      ? 'morning'
      : hour >= 12 && hour < 17
      ? 'afternoon'
      : 'evening'

  const displayName = name ? name.split(' ')[0] : null
  return displayName
    ? `Good ${timeOfDay}, ${displayName}`
    : `Good ${timeOfDay}`
}

function isWithinTwoDays(dateStr: string | null): boolean {
  if (!dateStr) return false
  const due = new Date(dateStr)
  const twoDaysFromNow = new Date()
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
  return due <= twoDaysFromNow
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // ── Parallel data fetching ─────────────────────────────────────────────────
  const [
    jobsRes,
    followUpsRes,
    collectionRes,
    profileRes,
    experiencesRes,
    skillsRes,
    educationRes,
    projectsRes,
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('follow_ups')
      .select('*, jobs(title, company)')
      .eq('user_id', user.id)
      .eq('status', 'pending'),

    supabase
      .from('collection')
      .select('*')
      .eq('user_id', user.id),

    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),

    supabase
      .from('experiences')
      .select('*')
      .eq('user_id', user.id),

    supabase
      .from('skills')
      .select('*')
      .eq('user_id', user.id),

    supabase
      .from('education')
      .select('*')
      .eq('user_id', user.id),

    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id),
  ])

  const jobs: Job[] = jobsRes.data ?? []
  const followUps: FollowUp[] = (followUpsRes.data ?? []) as FollowUp[]
  const collection: CollectionItem[] = collectionRes.data ?? []

  // ── Profile completeness ───────────────────────────────────────────────────
  let profileScore = 0
  if (profileRes.data) {
    const masterProfile: MasterProfile = {
      profile: profileRes.data,
      experiences: experiencesRes.data ?? [],
      skills: skillsRes.data ?? [],
      education: educationRes.data ?? [],
      projects: projectsRes.data ?? [],
    }
    profileScore = getProfileCompleteness(masterProfile).score
  }

  // ── Stats computations ─────────────────────────────────────────────────────
  const totalApplied = jobs.filter(
    (j) => j.status === 'applied' || j.status === 'interview' || j.status === 'rejected'
  ).length

  const interviews = jobs.filter((j) => j.status === 'interview').length

  const pendingFollowUps = followUps.filter(
    (fu) => fu.status === 'pending' && isWithinTwoDays(fu.due_at)
  ).length

  const overdueFollowUps = followUps.filter(
    (fu) => fu.status === 'pending' && isOverdue(fu.due_at)
  ).length

  const savedInCollection = collection.length

  // ── Greeting ──────────────────────────────────────────────────────────────
  const greeting = getGreeting(profileRes.data?.full_name ?? null)

  return (
    <div className="page-container">
      {/* Page header */}
      <header className="mb-6">
        <h1 className="text-2xl font-mono font-bold text-[#FAFAFA] tracking-tight">
          {greeting}
        </h1>
        <p className="text-sm text-[#71717A] mt-1 font-sans">
          Here&apos;s what&apos;s happening with your job search.
        </p>
      </header>

      {/* Profile completeness warning banner */}
      {profileScore < 60 && (
        <div className="mb-5">
          <ProfileBanner score={profileScore} />
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-6">
        <QuickActions />
      </div>

      {/* Stats grid — hero section */}
      <div className="mb-6">
        <StatsGrid
          totalApplied={totalApplied}
          interviews={interviews}
          pendingFollowUps={pendingFollowUps}
          overdueFollowUps={overdueFollowUps}
          savedInCollection={savedInCollection}
        />
      </div>

      {/* Main content — two-column on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Recent applications — 2/3 width on lg */}
        <div className="lg:col-span-2">
          <RecentJobs jobs={jobs} />
        </div>

        {/* Pending follow-ups — 1/3 width on lg */}
        <div className="lg:col-span-1">
          <PendingFollowUpsWidget followUps={followUps} />
        </div>
      </div>

      {/* Activity feed — full width */}
      <ActivityFeed jobs={jobs} collection={collection} />
    </div>
  )
}
