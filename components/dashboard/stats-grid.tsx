import { Send, CalendarCheck, Bell, Bookmark, type LucideIcon } from 'lucide-react'

interface StatsGridProps {
  totalApplied: number
  interviews: number
  pendingFollowUps: number
  overdueFollowUps: number
  savedInCollection: number
}

interface StatCardProps {
  label: string
  sublabel: string
  value: number | string
  icon: LucideIcon
  accent?: 'default' | 'amber' | 'red'
  extra?: React.ReactNode
}

function StatCard({ label, sublabel, value, icon: Icon, accent = 'default', extra }: StatCardProps) {
  return (
    <article
      className="card relative flex flex-col gap-3 p-5 border-l-2 border-l-blue-600 overflow-hidden"
      aria-label={`${label}: ${value}`}
    >
      {/* Icon top-right — decorative, hidden from assistive tech */}
      <div className="absolute top-4 right-4 opacity-20" aria-hidden="true">
        <Icon
          size={28}
          className={
            accent === 'amber'
              ? 'text-amber-400'
              : accent === 'red'
              ? 'text-red-400'
              : 'text-blue-400'
          }
        />
      </div>

      {/* Big number */}
      <span
        className={[
          'font-mono text-4xl font-bold leading-none tabular-nums tracking-tight',
          accent === 'amber'
            ? 'text-amber-300'
            : accent === 'red'
            ? 'text-red-400'
            : 'text-[#FAFAFA]',
        ].join(' ')}
      >
        {value}
      </span>

      {/* Labels */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-[#FAFAFA]">{label}</span>
        <span className="text-xs text-[#71717A] font-mono">{sublabel}</span>
      </div>

      {/* Optional extra row */}
      {extra && <div className="mt-1">{extra}</div>}
    </article>
  )
}

export function StatsGrid({
  totalApplied,
  interviews,
  pendingFollowUps,
  overdueFollowUps,
  savedInCollection,
}: StatsGridProps) {
  const followUpsAccent = overdueFollowUps > 0 ? 'amber' : 'default'

  return (
    <section aria-label="Application statistics">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Applied"
          sublabel="Applications"
          value={totalApplied}
          icon={Send}
        />

        <StatCard
          label="Interviews"
          sublabel="Scheduled"
          value={interviews}
          icon={CalendarCheck}
          accent={interviews > 0 ? 'default' : 'default'}
        />

        <StatCard
          label="Follow-ups"
          sublabel="Pending"
          value={pendingFollowUps}
          icon={Bell}
          accent={followUpsAccent}
          extra={
            overdueFollowUps > 0 ? (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-red-400"
                role="alert"
                aria-label={`${overdueFollowUps} overdue follow-up${overdueFollowUps !== 1 ? 's' : ''}`}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"
                  aria-hidden="true"
                />
                {overdueFollowUps} overdue
              </span>
            ) : null
          }
        />

        <StatCard
          label="In Collection"
          sublabel="Jobs Saved"
          value={savedInCollection}
          icon={Bookmark}
        />
      </div>
    </section>
  )
}
