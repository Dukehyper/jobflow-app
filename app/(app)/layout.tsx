import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area — offset by sidebar on md+ */}
      <main
        id="main-content"
        className="md:ml-60 min-h-screen pb-[calc(4rem_+_env(safe-area-inset-bottom))] md:pb-0"
      >
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  )
}
