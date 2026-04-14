import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/settings-client'
import type { User } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Settings — AI Job Portal',
  description: 'Manage your account settings, data export, and account deletion.',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Pass only serialisable auth fields to the client component
  const userForClient: Pick<User, 'id' | 'email'> = {
    id: user.id,
    email: user.email ?? '',
  }

  return <SettingsClient user={userForClient} />
}
