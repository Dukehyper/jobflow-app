import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileCompleteness } from '@/lib/utils/profile-completeness'
import type { MasterProfile } from '@/types'
import { ProfileClient } from './profile-client'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch all profile data in parallel
  const [profileRes, experiencesRes, skillsRes, educationRes, projectsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
    supabase.from('skills').select('*').eq('user_id', user.id).order('category', { ascending: true }),
    supabase.from('education').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
    supabase.from('projects').select('*').eq('user_id', user.id).order('name', { ascending: true }),
  ])

  // If no profile row yet, create one (new user)
  let profile = profileRes.data
  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({ id: user.id, email: user.email })
      .select()
      .single()
    profile = newProfile
  }

  if (!profile) {
    redirect('/login')
  }

  const masterProfile: MasterProfile = {
    profile,
    experiences: experiencesRes.data ?? [],
    skills: skillsRes.data ?? [],
    education: educationRes.data ?? [],
    projects: projectsRes.data ?? [],
  }

  const completeness = getProfileCompleteness(masterProfile)
  const isNewUser = completeness.score < 20

  return (
    <ProfileClient
      initialData={masterProfile}
      initialCompleteness={completeness}
      showOnboarding={isNewUser}
    />
  )
}
