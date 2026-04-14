import type { Job, CollectionItem } from '@/types'

interface ActivityEvent {
  id: string
  text: string
  timestamp: string
}

interface ActivityFeedProps {
  jobs: Job[]
  collection: CollectionItem[]
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

function deriveActivityEvents(
  jobs: Job[],
  collection: CollectionItem[]
): ActivityEvent[] {
  const events: ActivityEvent[] = []

  for (const job of jobs) {
    // Applied event
    if (job.applied_at && (job.status === 'applied' || job.status === 'interview' || job.status === 'rejected')) {
      events.push({
        id: `applied-${job.id}`,
        text: `Applied to ${job.title} at ${job.company}`,
        timestamp: job.applied_at,
      })
    }

    // Interview scheduled
    if (job.status === 'interview') {
      events.push({
        id: `interview-${job.id}`,
        text: `Interview scheduled for ${job.title} at ${job.company}`,
        // interview status is a change after applied; use applied_at as proxy, offset slightly
        timestamp: job.applied_at ?? job.created_at,
      })
    }

    // Rejected
    if (job.status === 'rejected') {
      events.push({
        id: `rejected-${job.id}`,
        text: `Application rejected — ${job.title} at ${job.company}`,
        timestamp: job.applied_at ?? job.created_at,
      })
    }

    // Job created/saved to tracker
    if (job.status === 'saved') {
      events.push({
        id: `saved-${job.id}`,
        text: `Saved ${job.title} at ${job.company} to tracker`,
        timestamp: job.created_at,
      })
    }
  }

  // Collection saves
  for (const item of collection) {
    events.push({
      id: `collection-${item.id}`,
      text: `Added ${item.title}${item.company ? ` at ${item.company}` : ''} to collection`,
      timestamp: item.saved_at,
    })
  }

  // Sort descending by timestamp, deduplicate by id, take max 10
  const seen = new Set<string>()
  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })
    .slice(0, 10)
}

export function ActivityFeed({ jobs, collection }: ActivityFeedProps) {
  const events = deriveActivityEvents(jobs, collection)

  return (
    <section aria-labelledby="activity-feed-heading" className="card p-5">
      <h2 id="activity-feed-heading" className="section-title mb-4">
        Recent Activity
      </h2>

      {events.length === 0 ? (
        <p className="text-sm text-[#71717A] py-4" role="status">
          No recent activity. Start by adding jobs to your tracker or collection.
        </p>
      ) : (
        <ol
          className="flex flex-col gap-0"
          aria-label="Recent activity list"
        >
          {events.map((event, index) => (
            <li
              key={event.id}
              className="flex gap-3 relative"
            >
              {/* Timeline line */}
              <div className="flex flex-col items-center shrink-0 pt-1" aria-hidden="true">
                {/* Circle dot */}
                <span className="w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-[#111113] shrink-0" />
                {/* Connector line — hide on last item */}
                {index < events.length - 1 && (
                  <span className="w-px flex-1 bg-[#27272A] mt-1 mb-1" style={{ minHeight: '1rem' }} />
                )}
              </div>

              {/* Content */}
              <div className="flex items-start justify-between gap-3 min-w-0 flex-1 pb-3">
                <p className="text-sm text-[#A1A1AA] leading-snug min-w-0">
                  {event.text}
                </p>
                <time
                  dateTime={event.timestamp}
                  className="text-xs font-mono text-[#52525B] shrink-0 mt-0.5"
                  title={new Date(event.timestamp).toLocaleString()}
                >
                  {formatRelativeTime(event.timestamp)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
