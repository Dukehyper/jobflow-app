'use client'

import { useState, useCallback } from 'react'
import type { Profile } from '@/types'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

interface PersonalDetailsFormProps {
  profile: Profile
  onUpdate: (updated: Profile) => void
}

type FormFields = Pick<Profile, 'full_name' | 'email' | 'phone' | 'location' | 'linkedin' | 'portfolio'>

function toFormFields(p: Profile): FormFields {
  return {
    full_name: p.full_name ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    location: p.location ?? '',
    linkedin: p.linkedin ?? '',
    portfolio: p.portfolio ?? '',
  }
}

function isDirty(a: FormFields, b: FormFields): boolean {
  return (
    a.full_name !== b.full_name ||
    a.email !== b.email ||
    a.phone !== b.phone ||
    a.location !== b.location ||
    a.linkedin !== b.linkedin ||
    a.portfolio !== b.portfolio
  )
}

export function PersonalDetailsForm({ profile, onUpdate }: PersonalDetailsFormProps) {
  const [form, setForm] = useState<FormFields>(toFormFields(profile))
  const [saved, setSaved] = useState<FormFields>(toFormFields(profile))
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  const dirty = isDirty(form, saved)

  const handleChange = useCallback(
    (field: keyof FormFields) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }))
        if (status === 'success' || status === 'error') setStatus('idle')
      },
    [status]
  )

  const handleSave = async () => {
    setStatus('saving')
    setErrorMsg('')

    // Optimistic update
    const payload: FormFields = {
      full_name: form.full_name || null as unknown as string,
      email: form.email || null as unknown as string,
      phone: form.phone || null as unknown as string,
      location: form.location || null as unknown as string,
      linkedin: form.linkedin || null as unknown as string,
      portfolio: form.portfolio || null as unknown as string,
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { data: Profile | null; error: string | null }

      if (!res.ok || json.error) {
        throw new Error(json.error ?? 'Save failed')
      }

      setSaved(form)
      setStatus('success')
      onUpdate(json.data!)
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  const handleDiscard = () => {
    setForm(saved)
    setStatus('idle')
  }

  return (
    <section aria-labelledby="personal-details-heading" className="card p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="personal-details-heading" className="section-title">
          Personal Details
        </h2>
        {status === 'success' && (
          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono" role="status">
            <CheckCircle2 size={14} aria-hidden="true" />
            Saved
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1.5 text-red-400 text-xs font-mono" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            {errorMsg}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="full_name" className="label">
            Full Name
          </label>
          <input
            id="full_name"
            type="text"
            className="input"
            placeholder="Jane Smith"
            value={form.full_name ?? ''}
            onChange={handleChange('full_name')}
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="jane@example.com"
            value={form.email ?? ''}
            onChange={handleChange('email')}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            className="input"
            placeholder="+44 7700 900000"
            value={form.phone ?? ''}
            onChange={handleChange('phone')}
            autoComplete="tel"
          />
        </div>

        <div>
          <label htmlFor="location" className="label">
            Location
          </label>
          <input
            id="location"
            type="text"
            className="input"
            placeholder="London, UK"
            value={form.location ?? ''}
            onChange={handleChange('location')}
            autoComplete="address-level2"
          />
        </div>

        <div>
          <label htmlFor="linkedin" className="label">
            LinkedIn URL
          </label>
          <input
            id="linkedin"
            type="url"
            className="input"
            placeholder="https://linkedin.com/in/janesmith"
            value={form.linkedin ?? ''}
            onChange={handleChange('linkedin')}
            autoComplete="url"
          />
        </div>

        <div>
          <label htmlFor="portfolio" className="label">
            Portfolio URL
          </label>
          <input
            id="portfolio"
            type="url"
            className="input"
            placeholder="https://janesmith.dev"
            value={form.portfolio ?? ''}
            onChange={handleChange('portfolio')}
            autoComplete="url"
          />
        </div>
      </div>

      {dirty && (
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={status === 'saving'}
            className="btn-primary"
          >
            {status === 'saving' && (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            )}
            {status === 'saving' ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={status === 'saving'}
            className="btn-ghost"
          >
            Discard
          </button>
        </div>
      )}
    </section>
  )
}
