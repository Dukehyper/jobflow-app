import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'

interface ProfileBannerProps {
  score: number
}

export function ProfileBanner({ score }: ProfileBannerProps) {
  if (score >= 60) return null

  return (
    <div
      role="alert"
      aria-label={`Profile is ${score}% complete. Complete your profile to unlock AI features.`}
      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-4 rounded-xl bg-amber-950/50 border border-amber-800/60"
    >
      {/* Icon + text */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <AlertTriangle
          size={18}
          className="text-amber-400 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-200 leading-snug">
            Your profile is{' '}
            <span className="font-mono">{score}%</span> complete.
          </p>
          <p className="text-xs text-amber-300/70 mt-0.5 leading-snug">
            AI features — CV generation, cover letters, interview prep — require a complete profile.
          </p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-xs font-semibold font-mono text-amber-200 hover:text-amber-100 bg-amber-800/40 hover:bg-amber-800/60 border border-amber-700/50 px-3 py-2 rounded-lg transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]"
        aria-label="Go to profile to complete it"
      >
        Complete Profile
        <ArrowRight size={12} aria-hidden="true" />
      </Link>
    </div>
  )
}
