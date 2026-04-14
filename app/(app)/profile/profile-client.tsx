'use client'

import { useState, useCallback } from 'react'
import type { MasterProfile, ProfileCompleteness, Profile, Experience, Skill, Education, Project } from '@/types'
import { getProfileCompleteness } from '@/lib/utils/profile-completeness'
import { ProfileCompletenessBar } from '@/components/profile/profile-completeness-bar'
import { PersonalDetailsForm } from '@/components/profile/personal-details-form'
import { ExperienceSection } from '@/components/profile/experience-section'
import { SkillsSection } from '@/components/profile/skills-section'
import { EducationSection } from '@/components/profile/education-section'
import { ProjectsSection } from '@/components/profile/projects-section'
import { OnboardingFlow } from '@/components/profile/onboarding-flow'
import { AlertTriangle, X } from 'lucide-react'

interface ProfileClientProps {
  initialData: MasterProfile
  initialCompleteness: ProfileCompleteness
  showOnboarding: boolean
}

export function ProfileClient({
  initialData,
  initialCompleteness,
  showOnboarding: initialShowOnboarding,
}: ProfileClientProps) {
  const [data, setData] = useState<MasterProfile>(initialData)
  const [completeness, setCompleteness] = useState<ProfileCompleteness>(initialCompleteness)
  const [showOnboarding, setShowOnboarding] = useState(initialShowOnboarding)
  const [warningDismissed, setWarningDismissed] = useState(false)

  // Recompute completeness whenever data changes
  const updateCompleteness = useCallback((updated: MasterProfile) => {
    setCompleteness(getProfileCompleteness(updated))
  }, [])

  // ─── Profile handlers ─────────────────────────────────────────────────────

  const handleProfileUpdate = useCallback(
    (updated: Profile) => {
      setData((d) => {
        const next = { ...d, profile: updated }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  // ─── Experience handlers ───────────────────────────────────────────────────

  const handleExperienceAdd = useCallback(
    (exp: Experience) => {
      setData((d) => {
        const next = { ...d, experiences: [exp, ...d.experiences] }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  const handleExperienceUpdate = useCallback(
    (exp: Experience) => {
      setData((d) => {
        const next = { ...d, experiences: d.experiences.map((e) => (e.id === exp.id ? exp : e)) }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  const handleExperienceDelete = useCallback(
    (id: string) => {
      setData((d) => {
        const next = { ...d, experiences: d.experiences.filter((e) => e.id !== id) }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  // ─── Skill handlers ────────────────────────────────────────────────────────

  const handleSkillAdd = useCallback(
    (skill: Skill) => {
      setData((d) => {
        const next = { ...d, skills: [...d.skills, skill] }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  const handleSkillDelete = useCallback(
    (id: string) => {
      setData((d) => {
        const next = { ...d, skills: d.skills.filter((s) => s.id !== id) }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  // ─── Education handlers ────────────────────────────────────────────────────

  const handleEducationAdd = useCallback(
    (edu: Education) => {
      setData((d) => {
        const next = { ...d, education: [edu, ...d.education] }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  const handleEducationUpdate = useCallback(
    (edu: Education) => {
      setData((d) => {
        const next = { ...d, education: d.education.map((e) => (e.id === edu.id ? edu : e)) }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  const handleEducationDelete = useCallback(
    (id: string) => {
      setData((d) => {
        const next = { ...d, education: d.education.filter((e) => e.id !== id) }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  // ─── Project handlers ──────────────────────────────────────────────────────

  const handleProjectAdd = useCallback(
    (project: Project) => {
      setData((d) => {
        const next = { ...d, projects: [...d.projects, project] }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  const handleProjectUpdate = useCallback(
    (project: Project) => {
      setData((d) => {
        const next = {
          ...d,
          projects: d.projects.map((p) => (p.id === project.id ? project : p)),
        }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  const handleProjectDelete = useCallback(
    (id: string) => {
      setData((d) => {
        const next = { ...d, projects: d.projects.filter((p) => p.id !== id) }
        updateCompleteness(next)
        return next
      })
    },
    [updateCompleteness]
  )

  // ─── Onboarding completion ─────────────────────────────────────────────────

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
  }

  const showWarning = completeness.score < 60 && !warningDismissed

  return (
    <div className="page-container space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-[#FAFAFA] tracking-tight">
            Master Profile
          </h1>
          <p className="text-sm text-[#71717A] mt-1">
            Your profile powers every AI-generated document in this system.
          </p>
        </div>
      </div>

      {/* Persistent warning banner (score < 60%) */}
      {showWarning && (
        <div
          role="alert"
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-800/60"
        >
          <AlertTriangle
            size={16}
            className="text-amber-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-300 font-medium">Incomplete profile</p>
            <p className="text-xs text-amber-400/80 mt-0.5 leading-relaxed">
              The quality of every CV, cover letter, and interview answer depends on how complete
              this profile is. Missing:{' '}
              <span className="font-medium">
                {completeness.missing.slice(0, 3).join(', ')}
                {completeness.missing.length > 3 && ` and ${completeness.missing.length - 3} more`}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWarningDismissed(true)}
            className="shrink-0 text-amber-500 hover:text-amber-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded"
            aria-label="Dismiss warning"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Completeness bar */}
      <ProfileCompletenessBar completeness={completeness} />

      {/* Sections */}
      <PersonalDetailsForm profile={data.profile} onUpdate={handleProfileUpdate} />

      <ExperienceSection
        experiences={data.experiences}
        onAdd={handleExperienceAdd}
        onUpdate={handleExperienceUpdate}
        onDelete={handleExperienceDelete}
      />

      <SkillsSection
        skills={data.skills}
        onAdd={handleSkillAdd}
        onDelete={handleSkillDelete}
      />

      <EducationSection
        education={data.education}
        onAdd={handleEducationAdd}
        onUpdate={handleEducationUpdate}
        onDelete={handleEducationDelete}
      />

      <ProjectsSection
        projects={data.projects}
        onAdd={handleProjectAdd}
        onUpdate={handleProjectUpdate}
        onDelete={handleProjectDelete}
      />
    </div>
  )
}
