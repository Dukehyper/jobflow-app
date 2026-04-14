'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  User,
  MoreHorizontal,
} from 'lucide-react'

interface BottomNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Dashboard',  href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Tracker',    href: '/tracker',      icon: Briefcase },
  { label: 'Collection', href: '/collection',   icon: Bookmark },
  { label: 'Profile',    href: '/profile',      icon: User },
  { label: 'More',       href: '/settings',     icon: MoreHorizontal },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 md:hidden bg-[#111113] border-t border-[#27272A] z-40"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-stretch" role="list">
        {BOTTOM_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            label === 'More'
              ? pathname === href
              : pathname === href || pathname.startsWith(href + '/')

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
                className={[
                  'flex flex-col items-center justify-center gap-1 min-h-[44px] w-full',
                  'pb-safe-bottom',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-inset',
                  isActive ? 'text-[#2563EB]' : 'text-[#71717A] hover:text-[#A1A1AA]',
                ].join(' ')}
              >
                <Icon
                  size={20}
                  aria-hidden="true"
                  className={isActive ? 'text-[#2563EB]' : 'text-[#71717A]'}
                />
                <span
                  className={[
                    'text-2xs font-mono uppercase tracking-wider leading-none',
                    isActive ? 'text-[#2563EB]' : 'text-[#71717A]',
                  ].join(' ')}
                >
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
