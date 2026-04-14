'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  FileText,
  User,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',      href: '/dashboard',      icon: LayoutDashboard },
  { label: 'Tracker',        href: '/tracker',         icon: Briefcase },
  { label: 'Collection',     href: '/collection',      icon: Bookmark },
  { label: 'CV Manager',     href: '/cv-manager',      icon: FileText },
  { label: 'Profile',        href: '/profile',         icon: User },
  { label: 'Interview Prep', href: '/interview-prep',  icon: MessageSquare },
  { label: 'Follow-ups',     href: '/follow-ups',      icon: Bell },
  { label: 'Settings',       href: '/settings',        icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  async function handleLogout() {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 flex-col bg-[#111113] border-r border-[#27272A] z-40">
      {/* Logo */}
      <div className="flex items-center px-5 h-16 border-b border-[#27272A] shrink-0">
        <span className="font-mono text-lg font-bold tracking-tight text-[#2563EB] select-none">
          JOBFLOW
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto scrollbar-none py-3" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 px-3 rounded-lg text-sm font-medium min-h-[44px] transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1 focus-visible:ring-offset-[#111113]',
                    isActive
                      ? 'bg-blue-600/10 text-[#2563EB] border-l-2 border-[#2563EB] pl-[calc(0.75rem_-_2px)]'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] border-l-2 border-transparent pl-[calc(0.75rem_-_2px)]',
                  ].join(' ')}
                >
                  <Icon
                    size={17}
                    className={isActive ? 'text-[#2563EB]' : 'text-[#71717A]'}
                    aria-hidden="true"
                  />
                  <span className="font-sans">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-[#27272A] px-3 py-3 shrink-0">
        {userEmail && (
          <div className="px-3 py-1 mb-1">
            <p className="text-2xs font-mono text-[#71717A] uppercase tracking-wider mb-0.5">
              Signed in as
            </p>
            <p
              className="text-xs text-[#A1A1AA] truncate"
              title={userEmail}
            >
              {userEmail}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Log out"
          className={[
            'flex items-center gap-3 w-full px-3 rounded-lg text-sm font-medium min-h-[44px]',
            'text-[#71717A] hover:text-[#EF4444] hover:bg-red-950/30 transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1 focus-visible:ring-offset-[#111113]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          <LogOut size={17} aria-hidden="true" />
          <span className="font-sans">
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </span>
        </button>
      </div>
    </aside>
  )
}
