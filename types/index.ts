// =============================================================================
// AI Job Application System — Shared TypeScript Types
// =============================================================================

// ─── Auth & User ─────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  linkedin: string | null
  portfolio: string | null
  created_at: string
  updated_at: string
}

export interface Experience {
  id: string
  user_id: string
  role: string
  company: string
  start_date: string
  end_date: string | null
  is_current: boolean
  bullets: string[]
}

export interface Skill {
  id: string
  user_id: string
  name: string
  category: string | null
}

export interface Education {
  id: string
  user_id: string
  institution: string
  degree: string
  field: string
  start_date: string
  end_date: string | null
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  tech_stack: string[]
  outcome: string | null
  url: string | null
}

// ─── Master Profile (assembled) ──────────────────────────────────────────────

export interface MasterProfile {
  profile: Profile
  experiences: Experience[]
  skills: Skill[]
  education: Education[]
  projects: Project[]
}

// ─── CV ──────────────────────────────────────────────────────────────────────

export type CVType = 'career' | 'temp'

export interface CV {
  id: string
  user_id: string
  type: CVType
  template_id: string | null
  base_content: Record<string, unknown> | null
  updated_at: string
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export type JobStatus = 'saved' | 'applied' | 'interview' | 'rejected'

export interface Job {
  id: string
  user_id: string
  source_url: string | null
  title: string
  company: string
  description: string | null
  cv_type: CVType | null
  status: JobStatus
  applied_at: string | null
  created_at: string
  notes: string | null
  generated_cv: string | null
  generated_cv_edited: string | null
  cv_manually_edited: boolean
  generated_cover_letter: string | null
  generated_cover_letter_edited: string | null
  cover_letter_manually_edited: boolean
  duplicate_hash: string | null
}

// ─── Interview Prep ───────────────────────────────────────────────────────────

export type InterviewRound = 'basic' | 'intermediate' | 'advanced'

export interface InterviewPrep {
  id: string
  job_id: string
  user_id: string
  round: InterviewRound
  question: string
  answer: string | null
  created_at: string
}

// ─── Follow-ups ───────────────────────────────────────────────────────────────

export type FollowUpStatus = 'pending' | 'sent'

export interface FollowUp {
  id: string
  job_id: string
  user_id: string
  generated_email: string | null
  status: FollowUpStatus
  due_at: string | null
  sent_at: string | null
  // Joined from jobs table
  job?: Pick<Job, 'title' | 'company' | 'applied_at'>
}

// ─── Collection ───────────────────────────────────────────────────────────────

export type CollectionStatus = 'saved' | 'shortlisted'

export interface CollectionItem {
  id: string
  user_id: string
  url: string | null
  title: string
  company: string | null
  notes: string | null
  status: CollectionStatus
  saved_at: string
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface GenerateCVPayload {
  job_id: string
  cv_type: CVType
}

export interface GenerateCoverLetterPayload {
  job_id: string
  cv_type: CVType
}

export interface GenerateQuestionsPayload {
  job_id: string
  round: InterviewRound
}

export interface GenerateAnswersPayload {
  job_id: string
  question_ids: string[]
}

export interface GenerateFollowupPayload {
  job_id: string
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export interface ProfileCompleteness {
  score: number // 0–100
  missing: string[]
  sections: {
    personal: boolean
    experiences: boolean
    skills: boolean
    education: boolean
    projects: boolean
  }
}

export type SortDirection = 'asc' | 'desc'

export interface TrackerFilters {
  status: JobStatus | 'all'
  cv_type: CVType | 'all'
  sort_by: 'created_at' | 'company' | 'status'
  sort_dir: SortDirection
}
