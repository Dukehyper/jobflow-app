import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CV, MasterProfile } from '@/types'
import { CVManagerClient } from '@/components/cv-manager/cv-manager-client'

// ---------------------------------------------------------------------------
// Server component — fetch both CVs + MasterProfile, then render client page
// ---------------------------------------------------------------------------
export const metadata = {
  title: 'CV Manager | JOBFLOW',
  description: 'Manage your Career and Temp CVs, pick a template, and edit your base content.',
}

async function fetchMasterProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<MasterProfile> {
  const [profileRes, expRes, skillsRes, eduRes, projRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('experiences').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
    supabase.from('skills').select('*').eq('user_id', userId),
    supabase.from('education').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
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

export default async function CVManagerPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch CVs and MasterProfile in parallel
  const [cvsRes, masterProfile] = await Promise.all([
    supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .in('type', ['career', 'temp']),
    fetchMasterProfile(supabase, user.id),
  ])

  const cvs: CV[] = cvsRes.data ?? []
  const careerCV = cvs.find((c) => c.type === 'career') ?? null
  const tempCV = cvs.find((c) => c.type === 'temp') ?? null

  return (
    <CVManagerClient
      careerCV={careerCV}
      tempCV={tempCV}
      masterProfile={masterProfile}
    />
  )
}
