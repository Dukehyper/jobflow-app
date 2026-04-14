'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile, Experience, Skill, Education, Project } from '@/types'
import { ArrowRight, ArrowLeft, SkipForward, CheckCircle2, Loader2, X } from 'lucide-react'

// ─── Step definitions ──────────────────────────────────────────────────────────

type StepId = 'personal' | 'experience' | 'skills' | 'education' | 'projects'

interface Step {
  id: StepId
  title: string
  prompt: string
  hint: string
}

const STEPS: Step[] = [
  {
    id: 'personal',
    title: 'Personal Details',
    prompt: "Let's start with the basics — how should employers reach you?",
    hint: 'Fill in as many fields as you can. LinkedIn is especially important for recruiters.',
  },
  {
    id: 'experience',
    title: 'Work Experience',
    prompt:
      "What's your most recent role? Tell us what you did and what you achieved.",
    hint: 'Add bullet points with specific numbers and outcomes — this powers your AI-generated CVs.',
  },
  {
    id: 'skills',
    title: 'Skills',
    prompt: 'What are your strongest technical and professional skills?',
    hint: 'Add at least 5 skills across different categories for best AI results.',
  },
  {
    id: 'education',
    title: 'Education',
    prompt: 'Where did you study and what did you graduate in?',
    hint: 'Include your highest level of education. You can add more later.',
  },
  {
    id: 'projects',
    title: 'Projects',
    prompt: "Describe a project you're proud of — what did you build and what was the result?",
    hint: 'Projects differentiate you from other candidates and show real-world impact.',
  },
]

// ─── Step forms ───────────────────────────────────────────────────────────────

interface PersonalStepProps {
  onDone: (profile: Profile) => void
}

function PersonalStep({ onDone }: PersonalStepProps) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSave = async () => {
    setStatus('saving')
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = (await res.json()) as { data: Profile | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Save failed')
      onDone(json.data!)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      {status === 'error' && (
        <p className="text-xs text-red-400" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ob-full_name" className="label">Full Name</label>
          <input id="ob-full_name" type="text" className="input" placeholder="Jane Smith"
            value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="ob-email" className="label">Email</label>
          <input id="ob-email" type="email" className="input" placeholder="jane@example.com"
            value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="ob-phone" className="label">Phone</label>
          <input id="ob-phone" type="tel" className="input" placeholder="+44 7700 900000"
            value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} autoComplete="tel" />
        </div>
        <div>
          <label htmlFor="ob-location" className="label">Location</label>
          <input id="ob-location" type="text" className="input" placeholder="London, UK"
            value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="ob-linkedin" className="label">LinkedIn URL</label>
          <input id="ob-linkedin" type="url" className="input" placeholder="https://linkedin.com/in/janesmith"
            value={form.linkedin} onChange={(e) => setForm(f => ({ ...f, linkedin: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="ob-portfolio" className="label">Portfolio URL <span className="text-[#71717A] normal-case font-sans tracking-normal">(optional)</span></label>
          <input id="ob-portfolio" type="url" className="input" placeholder="https://janesmith.dev"
            value={form.portfolio} onChange={(e) => setForm(f => ({ ...f, portfolio: e.target.value }))} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="button" onClick={handleSave} disabled={status === 'saving' || !form.full_name.trim()} className="btn-primary">
          {status === 'saving' && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {status === 'saving' ? 'Saving…' : 'Save & Continue'}
          {status !== 'saving' && <ArrowRight size={14} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

interface ExperienceStepProps {
  onDone: (exp: Experience) => void
  onSkip: () => void
}

function ExperienceStep({ onDone, onSkip }: ExperienceStepProps) {
  const [form, setForm] = useState({
    role: '',
    company: '',
    start_date: '',
    end_date: null as string | null,
    is_current: false,
    bullets: ['', ''],
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const updateBullet = (i: number, val: string) =>
    setForm(f => { const bullets = [...f.bullets]; bullets[i] = val; return { ...f, bullets } })

  const handleSave = async () => {
    if (!form.role.trim() || !form.company.trim()) return
    setStatus('saving')
    const payload = { ...form, end_date: form.is_current ? null : form.end_date, bullets: form.bullets.filter(b => b.trim()) }
    try {
      const res = await fetch('/api/profile/experiences', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { data: Experience | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed')
      onDone(json.data!)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error'); setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      {status === 'error' && <p className="text-xs text-red-400" role="alert">{errorMsg}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ob-role" className="label">Job Title</label>
          <input id="ob-role" type="text" className="input" placeholder="Software Engineer"
            value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="ob-company" className="label">Company</label>
          <input id="ob-company" type="text" className="input" placeholder="Acme Corp"
            value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="ob-start" className="label">Start Date</label>
          <input id="ob-start" type="month" className="input"
            value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="ob-end" className="label">End Date</label>
          <input id="ob-end" type="month" className="input" disabled={form.is_current}
            value={form.end_date ?? ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value || null }))} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input id="ob-current" type="checkbox" className="w-4 h-4 accent-blue-600"
          checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked, end_date: null }))} />
        <label htmlFor="ob-current" className="text-sm text-[#A1A1AA] cursor-pointer">I currently work here</label>
      </div>

      <div>
        <p className="label mb-2">Key Achievements (2+ recommended)</p>
        <div className="space-y-2">
          {form.bullets.map((bullet, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[#71717A] text-xs shrink-0" aria-hidden="true">•</span>
              <input type="text" className="input flex-1"
                placeholder={i === 0 ? 'Led migration to microservices, cutting latency by 40%' : 'Built automated test suite, increasing coverage to 85%'}
                value={bullet} onChange={e => updateBullet(i, e.target.value)}
                aria-label={`Bullet ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={status === 'saving' || !form.role.trim() || !form.company.trim()} className="btn-primary">
          {status === 'saving' && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {status === 'saving' ? 'Saving…' : 'Save & Continue'}
          {status !== 'saving' && <ArrowRight size={14} aria-hidden="true" />}
        </button>
        <button type="button" onClick={onSkip} className="btn-ghost">
          <SkipForward size={14} aria-hidden="true" />
          Skip
        </button>
      </div>
    </div>
  )
}

interface SkillsStepProps {
  onDone: (skills: Skill[]) => void
  onSkip: () => void
}

function SkillsStep({ onDone, onSkip }: SkillsStepProps) {
  const [inputValue, setInputValue] = useState('')
  const [category, setCategory] = useState('Technical')
  const [addedSkills, setAddedSkills] = useState<Skill[]>([])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const addSkill = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (addedSkills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" already added`); return
    }
    setAdding(true); setError('')
    try {
      const res = await fetch('/api/profile/skills', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, category }),
      })
      const json = (await res.json()) as { data: Skill | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed')
      setAddedSkills(prev => [...prev, json.data!])
      setInputValue('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally { setAdding(false) }
  }, [addedSkills, category])

  const removeSkill = async (skill: Skill) => {
    try {
      await fetch(`/api/profile/skills/${skill.id}`, { method: 'DELETE' })
      setAddedSkills(prev => prev.filter(s => s.id !== skill.id))
    } catch { /* best effort */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <label htmlFor="ob-skill" className="label">Skill <span className="text-[#71717A] normal-case font-sans tracking-normal">(press Enter)</span></label>
          <input id="ob-skill" type="text" className="input" placeholder="TypeScript, React, Docker…"
            value={inputValue} disabled={adding}
            onChange={e => { setInputValue(e.target.value); if (error) setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(inputValue) } }} />
        </div>
        <div className="sm:w-40">
          <label htmlFor="ob-skill-cat" className="label">Category</label>
          <select id="ob-skill-cat" className="input" value={category} onChange={e => setCategory(e.target.value)}>
            {['Technical','Programming Languages','Frameworks','Tools & Platforms','Soft Skills','Design','Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="sm:self-end">
          <button type="button" onClick={() => addSkill(inputValue)} disabled={adding || !inputValue.trim()} className="btn-secondary w-full sm:w-auto">Add</button>
        </div>
      </div>

      {error && <p className="text-xs text-red-400" role="alert">{error}</p>}

      {addedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Added skills">
          {addedSkills.map(skill => (
            <span key={skill.id} role="listitem"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-[#18181B] border border-[#27272A] text-[#A1A1AA]">
              {skill.name}
              <button type="button" onClick={() => removeSkill(skill)}
                className="text-[#71717A] hover:text-red-400 transition-colors"
                aria-label={`Remove ${skill.name}`}>
                <X size={10} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      {addedSkills.length < 5 && (
        <p className="text-xs text-[#71717A]">Add {Math.max(0, 5 - addedSkills.length)} more to meet the minimum.</p>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onDone(addedSkills)} disabled={addedSkills.length === 0} className="btn-primary">
          Continue <ArrowRight size={14} aria-hidden="true" />
        </button>
        <button type="button" onClick={onSkip} className="btn-ghost">
          <SkipForward size={14} aria-hidden="true" />
          Skip
        </button>
      </div>
    </div>
  )
}

interface EducationStepProps {
  onDone: (edu: Education) => void
  onSkip: () => void
}

function EducationStep({ onDone, onSkip }: EducationStepProps) {
  const [form, setForm] = useState({ institution: '', degree: '', field: '', start_date: '', end_date: null as string | null })
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSave = async () => {
    if (!form.institution.trim() || !form.degree.trim()) return
    setStatus('saving')
    try {
      const res = await fetch('/api/profile/education', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = (await res.json()) as { data: Education | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed')
      onDone(json.data!)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error'); setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      {status === 'error' && <p className="text-xs text-red-400" role="alert">{errorMsg}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="ob-institution" className="label">Institution</label>
          <input id="ob-institution" type="text" className="input" placeholder="University of London"
            value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="ob-degree" className="label">Degree</label>
          <input id="ob-degree" type="text" className="input" placeholder="Bachelor of Science"
            value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="ob-field" className="label">Field of Study</label>
          <input id="ob-field" type="text" className="input" placeholder="Computer Science"
            value={form.field} onChange={e => setForm(f => ({ ...f, field: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="ob-edu-start" className="label">Start Date</label>
          <input id="ob-edu-start" type="month" className="input"
            value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="ob-edu-end" className="label">End Date <span className="text-[#71717A] normal-case font-sans tracking-normal">(or expected)</span></label>
          <input id="ob-edu-end" type="month" className="input"
            value={form.end_date ?? ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value || null }))} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={status === 'saving' || !form.institution.trim() || !form.degree.trim()} className="btn-primary">
          {status === 'saving' && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {status === 'saving' ? 'Saving…' : 'Save & Continue'}
          {status !== 'saving' && <ArrowRight size={14} aria-hidden="true" />}
        </button>
        <button type="button" onClick={onSkip} className="btn-ghost">
          <SkipForward size={14} aria-hidden="true" />
          Skip
        </button>
      </div>
    </div>
  )
}

interface ProjectsStepProps {
  onDone: (project: Project) => void
  onSkip: () => void
}

function ProjectsStep({ onDone, onSkip }: ProjectsStepProps) {
  const [form, setForm] = useState({ name: '', description: '', tech_stack: [] as string[], outcome: null as string | null, url: null as string | null })
  const [techInput, setTechInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const addTech = (val: string) => {
    const t = val.trim()
    if (!t || form.tech_stack.includes(t)) return
    setForm(f => ({ ...f, tech_stack: [...f.tech_stack, t] }))
    setTechInput('')
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) return
    setStatus('saving')
    try {
      const res = await fetch('/api/profile/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = (await res.json()) as { data: Project | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed')
      onDone(json.data!)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error'); setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      {status === 'error' && <p className="text-xs text-red-400" role="alert">{errorMsg}</p>}

      <div>
        <label htmlFor="ob-proj-name" className="label">Project Name</label>
        <input id="ob-proj-name" type="text" className="input" placeholder="Portfolio Website"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label htmlFor="ob-proj-desc" className="label">Description</label>
        <textarea id="ob-proj-desc" className="textarea"
          placeholder="What you built, your role, and the key technical choices."
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div>
        <label htmlFor="ob-proj-tech" className="label">Tech Stack <span className="text-[#71717A] normal-case font-sans tracking-normal">(Enter to add)</span></label>
        <input id="ob-proj-tech" type="text" className="input" placeholder="React, TypeScript, Postgres…"
          value={techInput} onChange={e => setTechInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(techInput) } }}
          onBlur={() => techInput.trim() && addTech(techInput)} />
        {form.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.tech_stack.map(t => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-950 text-blue-300 font-mono">
                {t}
                <button type="button" onClick={() => setForm(f => ({ ...f, tech_stack: f.tech_stack.filter(x => x !== t) }))}
                  aria-label={`Remove ${t}`} className="hover:text-white">
                  <X size={10} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <label htmlFor="ob-proj-outcome" className="label">Outcome <span className="text-[#71717A] normal-case font-sans tracking-normal">(optional)</span></label>
        <input id="ob-proj-outcome" type="text" className="input" placeholder="500+ users, featured in TechCrunch"
          value={form.outcome ?? ''} onChange={e => setForm(f => ({ ...f, outcome: e.target.value || null }))} />
      </div>
      <div>
        <label htmlFor="ob-proj-url" className="label">URL <span className="text-[#71717A] normal-case font-sans tracking-normal">(optional)</span></label>
        <input id="ob-proj-url" type="url" className="input" placeholder="https://github.com/you/project"
          value={form.url ?? ''} onChange={e => setForm(f => ({ ...f, url: e.target.value || null }))} />
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={status === 'saving' || !form.name.trim() || !form.description.trim()} className="btn-primary">
          {status === 'saving' && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {status === 'saving' ? 'Saving…' : 'Save & Finish'}
          {status !== 'saving' && <CheckCircle2 size={14} aria-hidden="true" />}
        </button>
        <button type="button" onClick={onSkip} className="btn-ghost">
          <SkipForward size={14} aria-hidden="true" />
          Skip
        </button>
      </div>
    </div>
  )
}

// ─── Main Onboarding Flow ──────────────────────────────────────────────────────

interface OnboardingFlowProps {
  onComplete: () => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const step = STEPS[currentStep]
  const totalSteps = STEPS.length

  const next = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(s => s + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    setIsComplete(true)
    setTimeout(() => {
      onComplete()
      router.push('/dashboard?onboarded=1')
    }, 1500)
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-400" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-xl font-mono font-bold text-[#FAFAFA]">Profile set up!</h2>
          <p className="text-sm text-[#A1A1AA]">
            Taking you to the dashboard — your AI tools are ready.
          </p>
          <Loader2 size={18} className="animate-spin text-[#71717A] mx-auto" aria-hidden="true" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="font-mono text-blue-500 text-xs uppercase tracking-widest mb-3">
            Getting started
          </p>
          <h1 className="text-2xl font-mono font-bold text-[#FAFAFA] mb-1">
            Build your master profile
          </h1>
          <p className="text-sm text-[#71717A]">
            This powers every CV, cover letter, and interview answer the AI generates.
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-0 mb-8" role="list" aria-label="Onboarding steps">
          {STEPS.map((s, i) => {
            const done = i < currentStep
            const active = i === currentStep
            return (
              <div key={s.id} className="flex-1 flex items-center" role="listitem">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={[
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all',
                      done
                        ? 'bg-emerald-600 text-white'
                        : active
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0A0A0B]'
                          : 'bg-[#27272A] text-[#71717A]',
                    ].join(' ')}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? <CheckCircle2 size={14} aria-hidden="true" /> : i + 1}
                  </div>
                  <span
                    className={[
                      'hidden sm:block text-xs mt-1.5 font-mono text-center',
                      active ? 'text-[#FAFAFA]' : done ? 'text-emerald-500' : 'text-[#71717A]',
                    ].join(' ')}
                  >
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={[
                      'h-px flex-1 mx-1 transition-colors',
                      done ? 'bg-emerald-700' : 'bg-[#27272A]',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="card p-6 space-y-5">
          {/* Step header */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="label mb-0">
                Step {currentStep + 1} of {totalSteps}
              </span>
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(s => s - 1)}
                  className="btn-ghost text-xs px-2 py-1 min-h-[36px]"
                  aria-label="Go back"
                >
                  <ArrowLeft size={13} aria-hidden="true" />
                  Back
                </button>
              )}
            </div>
            <h2 className="text-lg font-mono font-semibold text-[#FAFAFA]">{step.title}</h2>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">{step.prompt}</p>
            <p className="text-xs text-[#71717A] border-l-2 border-[#27272A] pl-3 mt-2">
              {step.hint}
            </p>
          </div>

          <div className="divider" aria-hidden="true" />

          {/* Step content */}
          {step.id === 'personal' && (
            <PersonalStep onDone={() => next()} />
          )}
          {step.id === 'experience' && (
            <ExperienceStep onDone={() => next()} onSkip={next} />
          )}
          {step.id === 'skills' && (
            <SkillsStep onDone={() => next()} onSkip={next} />
          )}
          {step.id === 'education' && (
            <EducationStep onDone={() => next()} onSkip={next} />
          )}
          {step.id === 'projects' && (
            <ProjectsStep onDone={() => handleComplete()} onSkip={handleComplete} />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#71717A] mt-6">
          You can always update your profile later from the Profile page.
        </p>
      </div>
    </div>
  )
}
