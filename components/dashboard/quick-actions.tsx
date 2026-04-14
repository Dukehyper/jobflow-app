import Link from 'next/link'
import { PlusCircle, LayoutList, User } from 'lucide-react'

export function QuickActions() {
  return (
    <section aria-label="Quick actions">
      <div className="flex flex-wrap gap-2">
        {/* Add Job — navigates to collection where user can add/save jobs */}
        <Link
          href="/collection"
          className="btn-primary text-sm"
          aria-label="Add a new job to your collection"
        >
          <PlusCircle size={16} aria-hidden="true" />
          Add Job
        </Link>

        {/* View Tracker */}
        <Link
          href="/tracker"
          className="btn-secondary text-sm"
          aria-label="Open your application tracker"
        >
          <LayoutList size={16} aria-hidden="true" />
          View Tracker
        </Link>

        {/* Open Profile */}
        <Link
          href="/profile"
          className="btn-ghost text-sm"
          aria-label="Open your profile"
        >
          <User size={16} aria-hidden="true" />
          Open Profile
        </Link>
      </div>
    </section>
  )
}
