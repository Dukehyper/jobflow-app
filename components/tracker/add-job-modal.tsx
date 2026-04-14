'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'
import type { CVType, Job } from '@/types'

interface AddJobModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobAdded: (job: Job) => void
}

interface FormState {
  title: string
  company: string
  source_url: string
  description: string
  cv_type: CVType | ''
  notes: string
}

const INITIAL_FORM: FormState = {
  title: '',
  company: '',
  source_url: '',
  description: '',
  cv_type: '',
  notes: '',
}

interface DuplicateInfo {
  id: string
  title: string
  company: string
}

export function AddJobModal({ open, onOpenChange, onJobAdded }: AddJobModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Clear error on change
    if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
    if (duplicate) setDuplicate(null)
    if (serverError) setServerError(null)
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormState, string>> = {}
    if (!form.title.trim()) newErrors.title = 'Job title is required'
    if (!form.company.trim()) newErrors.company = 'Company name is required'
    if (form.source_url.trim()) {
      try {
        new URL(form.source_url.trim())
      } catch {
        newErrors.source_url = 'Enter a valid URL (e.g. https://…)'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setDuplicate(null)
    setServerError(null)

    try {
      const payload: Record<string, string> = {
        title: form.title.trim(),
        company: form.company.trim(),
      }
      if (form.source_url.trim()) payload.source_url = form.source_url.trim()
      if (form.description.trim()) payload.description = form.description.trim()
      if (form.cv_type) payload.cv_type = form.cv_type
      if (form.notes.trim()) payload.notes = form.notes.trim()

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json() as {
        data: Job | null
        error: string | null
        existingJob?: Job
      }

      if (res.status === 409 && json.error === 'DUPLICATE' && json.existingJob) {
        setDuplicate({
          id: json.existingJob.id,
          title: json.existingJob.title,
          company: json.existingJob.company,
        })
        return
      }

      if (!res.ok || json.error || !json.data) {
        setServerError(json.error ?? 'Something went wrong. Please try again.')
        return
      }

      onJobAdded(json.data)
      setForm(INITIAL_FORM)
      setErrors({})
      onOpenChange(false)
    } catch {
      setServerError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenChange(val: boolean) {
    if (!submitting) {
      if (!val) {
        setForm(INITIAL_FORM)
        setErrors({})
        setDuplicate(null)
        setServerError(null)
      }
      onOpenChange(val)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90dvh] overflow-y-auto card-elevated shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          aria-describedby="add-job-desc"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#27272A]">
            <div>
              <Dialog.Title className="section-title">Add Job Manually</Dialog.Title>
              <p id="add-job-desc" className="text-xs text-[#71717A] mt-0.5 font-mono">
                Track a new job application
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                className="btn-ghost p-2 min-h-[44px] min-w-[44px] rounded-lg"
                aria-label="Close dialog"
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
            {/* Duplicate warning */}
            {duplicate && (
              <div className="flex items-start gap-3 px-4 py-3 bg-amber-950/40 border border-amber-800/50 rounded-lg">
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-300">
                  <p className="font-medium">You&apos;ve already saved this job.</p>
                  <p className="text-amber-400 mt-0.5">
                    {duplicate.title} at {duplicate.company}.{' '}
                    <a
                      href={`/tracker/${duplicate.id}`}
                      className="underline underline-offset-2 hover:text-amber-200 inline-flex items-center gap-1"
                    >
                      View it <ExternalLink size={12} />
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-3 px-4 py-3 bg-red-950/40 border border-red-800/50 rounded-lg">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{serverError}</p>
              </div>
            )}

            {/* Job Title */}
            <div>
              <label htmlFor="title" className="label">
                Job Title <span className="text-red-400 normal-case">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className={`input${errors.title ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g. Senior Product Designer"
                value={form.title}
                onChange={handleChange}
                autoComplete="off"
                aria-describedby={errors.title ? 'title-error' : undefined}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p id="title-error" className="mt-1 text-xs text-red-400" role="alert">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="label">
                Company <span className="text-red-400 normal-case">*</span>
              </label>
              <input
                id="company"
                name="company"
                type="text"
                className={`input${errors.company ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g. Acme Corp"
                value={form.company}
                onChange={handleChange}
                autoComplete="off"
                aria-describedby={errors.company ? 'company-error' : undefined}
                aria-invalid={!!errors.company}
              />
              {errors.company && (
                <p id="company-error" className="mt-1 text-xs text-red-400" role="alert">
                  {errors.company}
                </p>
              )}
            </div>

            {/* Job URL */}
            <div>
              <label htmlFor="source_url" className="label">
                Job URL <span className="text-[#52525B] normal-case font-sans font-normal">optional</span>
              </label>
              <input
                id="source_url"
                name="source_url"
                type="url"
                className={`input${errors.source_url ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="https://..."
                value={form.source_url}
                onChange={handleChange}
                autoComplete="off"
                aria-describedby={errors.source_url ? 'url-error' : undefined}
                aria-invalid={!!errors.source_url}
              />
              {errors.source_url && (
                <p id="url-error" className="mt-1 text-xs text-red-400" role="alert">
                  {errors.source_url}
                </p>
              )}
            </div>

            {/* Job Description */}
            <div>
              <label htmlFor="description" className="label">
                Job Description <span className="text-[#52525B] normal-case font-sans font-normal">optional</span>
              </label>
              <textarea
                id="description"
                name="description"
                className="textarea"
                placeholder="Paste the job description here…"
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {/* CV Type */}
            <div>
              <label htmlFor="cv_type" className="label">
                CV Type <span className="text-[#52525B] normal-case font-sans font-normal">optional</span>
              </label>
              <select
                id="cv_type"
                name="cv_type"
                className="input appearance-none cursor-pointer"
                value={form.cv_type}
                onChange={handleChange}
              >
                <option value="">Select CV type…</option>
                <option value="career">Career</option>
                <option value="temp">Temp</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="label">
                Notes <span className="text-[#52525B] normal-case font-sans font-normal">optional</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                className="textarea"
                placeholder="Any personal notes about this role…"
                value={form.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Add Job'
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
