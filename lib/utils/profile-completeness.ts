import type { MasterProfile, ProfileCompleteness } from '@/types'

export function getProfileCompleteness(profile: MasterProfile): ProfileCompleteness {
  const missing: string[] = []

  // Personal section (30 points)
  const { full_name, email, phone, location, linkedin } = profile.profile
  const personalComplete = !!(full_name && email && phone && location && linkedin)
  if (!full_name) missing.push('Full name')
  if (!email) missing.push('Email address')
  if (!phone) missing.push('Phone number')
  if (!location) missing.push('Location')
  if (!linkedin) missing.push('LinkedIn URL')

  // Experience section (25 points)
  const experiencesComplete = profile.experiences.length > 0
  if (!experiencesComplete) missing.push('At least one work experience')

  // Skills section (15 points)
  const skillsComplete = profile.skills.length >= 5
  if (!skillsComplete) missing.push(`At least 5 skills (have ${profile.skills.length})`)

  // Education section (15 points)
  const educationComplete = profile.education.length > 0
  if (!educationComplete) missing.push('At least one education entry')

  // Projects section (15 points)
  const projectsComplete = profile.projects.length > 0
  if (!projectsComplete) missing.push('At least one project')

  let score = 0
  if (personalComplete) score += 30
  if (experiencesComplete) score += 25
  if (skillsComplete) score += 15
  if (educationComplete) score += 15
  if (projectsComplete) score += 15

  // Bonus: bullet points in experiences
  const hasBullets = profile.experiences.some(e => e.bullets && e.bullets.length >= 2)
  if (hasBullets) score = Math.min(100, score + 5)

  return {
    score,
    missing,
    sections: {
      personal: personalComplete,
      experiences: experiencesComplete,
      skills: skillsComplete,
      education: educationComplete,
      projects: projectsComplete,
    },
  }
}
