'use client'

import { useEffect, useRef } from 'react'
import type { MasterProfile } from '@/types'
import type { TemplateId } from './template-selector'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CVPreviewProps {
  masterProfile: MasterProfile
  templateId: TemplateId | null
  baseText: string
}

// ---------------------------------------------------------------------------
// Print styles injected into <head> on mount
// ---------------------------------------------------------------------------
const PRINT_STYLE = `
@media print {
  body > * { display: none !important; }
  #cv-print-root { display: block !important; }
  #cv-print-root {
    position: fixed;
    inset: 0;
    background: white;
    color: black;
    font-family: Georgia, serif;
    padding: 2.5cm 2cm;
    font-size: 11pt;
    line-height: 1.5;
  }
  #cv-print-root h1 { font-size: 18pt; margin-bottom: 2pt; }
  #cv-print-root h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #ccc; margin-top: 14pt; margin-bottom: 6pt; }
  #cv-print-root .print-contact { font-size: 10pt; color: #444; }
  #cv-print-root .print-company { font-weight: bold; }
  #cv-print-root .print-date { color: #555; font-size: 9.5pt; }
  #cv-print-root ul { margin: 4pt 0 0 14pt; padding: 0; }
  #cv-print-root li { margin-bottom: 2pt; }
  .cv-preview-sidebar { display: none !important; }
}
`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Template renderers
// Each receives MasterProfile and renders the appropriate styled layout
// ---------------------------------------------------------------------------

function ClassicLayout({ profile: mp }: { profile: MasterProfile }) {
  const { profile, experiences, skills, education, projects } = mp
  return (
    <div className="text-[#1A1A1A] font-sans text-[11px] leading-relaxed">
      {/* Two-col header */}
      <div className="flex justify-between items-start pb-3 border-b-2 border-[#1A1A1A] mb-3">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#1A1A1A] leading-tight">
            {profile?.full_name ?? 'Your Name'}
          </h1>
          {profile?.location && (
            <p className="text-xs text-gray-500 mt-0.5">{profile.location}</p>
          )}
        </div>
        <div className="text-right text-xs text-gray-500 space-y-0.5">
          {profile?.email && <p>{profile.email}</p>}
          {profile?.phone && <p>{profile.phone}</p>}
          {profile?.linkedin && (
            <p className="text-blue-700 break-all">{profile.linkedin}</p>
          )}
          {profile?.portfolio && (
            <p className="text-blue-700 break-all">{profile.portfolio}</p>
          )}
        </div>
      </div>

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1.5">
            Experience
          </h2>
          {experiences.map((exp) => (
            <div key={exp.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-[11px]">{exp.role}</span>
                <span className="text-[10px] text-gray-500">
                  {formatDate(exp.start_date)} – {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                </span>
              </div>
              <p className="text-[10px] text-gray-500">{exp.company}</p>
              {exp.bullets.length > 0 && (
                <ul className="list-disc ml-4 mt-0.5 space-y-0.5">
                  {exp.bullets.map((b, i) => (
                    <li key={i} className="text-[10px]">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1.5">
            Skills
          </h2>
          <p className="text-[10px]">{skills.map((s) => s.name).join(' · ')}</p>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1.5">
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-1">
              <div className="flex justify-between">
                <span className="font-semibold text-[11px]">{edu.degree} in {edu.field}</span>
                <span className="text-[10px] text-gray-500">
                  {formatDate(edu.start_date)} – {formatDate(edu.end_date)}
                </span>
              </div>
              <p className="text-[10px] text-gray-500">{edu.institution}</p>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section>
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1.5">
            Projects
          </h2>
          {projects.map((proj) => (
            <div key={proj.id} className="mb-1.5">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-[11px]">{proj.name}</span>
                {proj.url && (
                  <span className="text-[10px] text-blue-700 break-all">{proj.url}</span>
                )}
              </div>
              <p className="text-[10px]">{proj.description}</p>
              {proj.tech_stack.length > 0 && (
                <p className="text-[10px] text-gray-500">{proj.tech_stack.join(', ')}</p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function ModernLayout({ profile: mp }: { profile: MasterProfile }) {
  const { profile, experiences, skills, education, projects } = mp
  return (
    <div className="text-[#1A1A1A] font-sans text-[11px] leading-relaxed">
      {/* Full-width blue accent header */}
      <div className="bg-blue-600 text-white px-4 py-3 -mx-4 -mt-4 mb-4 rounded-t-lg">
        <h1 className="text-xl font-bold font-mono leading-tight">
          {profile?.full_name ?? 'Your Name'}
        </h1>
        <div className="flex flex-wrap gap-x-3 mt-1 text-[10px] text-blue-100">
          {profile?.email && <span>{profile.email}</span>}
          {profile?.phone && <span>{profile.phone}</span>}
          {profile?.location && <span>{profile.location}</span>}
          {profile?.linkedin && <span>{profile.linkedin}</span>}
        </div>
      </div>

      {/* Experience — timeline style */}
      {experiences.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 mb-2 border-b border-blue-200 pb-0.5">
            Experience
          </h2>
          <div className="relative ml-3">
            <div className="absolute left-0 top-1 bottom-1 w-px bg-blue-200" />
            {experiences.map((exp, idx) => (
              <div key={exp.id} className="relative pl-4 mb-2">
                <div
                  className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-blue-500 border-2 border-white"
                  aria-hidden="true"
                />
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-[11px]">{exp.role}</span>
                  <span className="text-[10px] text-gray-500">
                    {formatDate(exp.start_date)} – {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                  </span>
                </div>
                <p className="text-[10px] text-blue-700 font-medium">{exp.company}</p>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc ml-4 mt-0.5 space-y-0.5">
                    {exp.bullets.map((b, i) => <li key={i} className="text-[10px]">{b}</li>)}
                  </ul>
                )}
                {idx < experiences.length - 1 && <div className="mb-2" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 mb-1.5 border-b border-blue-200 pb-0.5">
            Skills
          </h2>
          <div className="flex flex-wrap gap-1">
            {skills.map((s) => (
              <span key={s.id} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] border border-blue-100">
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 mb-1.5 border-b border-blue-200 pb-0.5">
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-1">
              <div className="flex justify-between">
                <span className="font-semibold text-[11px]">{edu.degree} in {edu.field}</span>
                <span className="text-[10px] text-gray-500">{formatDate(edu.start_date)} – {formatDate(edu.end_date)}</span>
              </div>
              <p className="text-[10px] text-gray-500">{edu.institution}</p>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section>
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 mb-1.5 border-b border-blue-200 pb-0.5">
            Projects
          </h2>
          {projects.map((proj) => (
            <div key={proj.id} className="mb-1.5">
              <span className="font-semibold text-[11px]">{proj.name}</span>
              {proj.url && <span className="ml-2 text-[10px] text-blue-600">{proj.url}</span>}
              <p className="text-[10px]">{proj.description}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function CompactLayout({ profile: mp }: { profile: MasterProfile }) {
  const { profile, experiences, skills, education, projects } = mp
  return (
    <div className="text-[#1A1A1A] font-sans text-[10px] leading-snug">
      {/* Dense header row */}
      <div className="flex items-center justify-between pb-1.5 border-b border-gray-400 mb-1.5">
        <h1 className="text-sm font-bold font-mono">{profile?.full_name ?? 'Your Name'}</h1>
        <div className="flex gap-2 text-[9.5px] text-gray-500">
          {profile?.email && <span>{profile.email}</span>}
          {profile?.phone && <span>{profile.phone}</span>}
          {profile?.location && <span>{profile.location}</span>}
        </div>
      </div>

      {/* Experience — tight rows */}
      {experiences.length > 0 && (
        <section className="mb-1.5">
          <h2 className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
            Experience
          </h2>
          {experiences.map((exp) => (
            <div key={exp.id} className="mb-1">
              <div className="flex justify-between">
                <span className="font-semibold">{exp.role}</span>
                <span className="text-[9.5px] text-gray-500">
                  {formatDate(exp.start_date)}–{exp.is_current ? 'Present' : formatDate(exp.end_date)}
                </span>
              </div>
              <p className="text-[9.5px] text-gray-500">{exp.company}</p>
              {exp.bullets.slice(0, 2).map((b, i) => (
                <p key={i} className="text-[9.5px] pl-2 before:content-['•'] before:mr-1">{b}</p>
              ))}
            </div>
          ))}
        </section>
      )}

      {/* Skills — comma list */}
      {skills.length > 0 && (
        <section className="mb-1.5">
          <h2 className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-0.5">Skills</h2>
          <p>{skills.map((s) => s.name).join(', ')}</p>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-1.5">
          <h2 className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-0.5">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="flex justify-between">
              <span className="font-semibold">{edu.degree}, {edu.institution}</span>
              <span className="text-[9.5px] text-gray-500">{formatDate(edu.end_date)}</span>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section>
          <h2 className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-0.5">Projects</h2>
          {projects.map((proj) => (
            <div key={proj.id} className="flex gap-1 mb-0.5">
              <span className="font-semibold shrink-0">{proj.name}:</span>
              <span className="text-gray-600">{proj.description}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function MinimalLayout({ profile: mp }: { profile: MasterProfile }) {
  const { profile, experiences, skills, education, projects } = mp
  return (
    <div className="text-[#1A1A1A] font-sans text-[11px] leading-relaxed text-center">
      {/* Centered name — maximum whitespace */}
      <div className="mb-4">
        <h1 className="text-2xl font-light font-mono tracking-widest uppercase mb-1">
          {profile?.full_name ?? 'Your Name'}
        </h1>
        <div className="flex justify-center gap-3 text-[10px] text-gray-400">
          {profile?.email && <span>{profile.email}</span>}
          {profile?.phone && <span>{profile.phone}</span>}
          {profile?.location && <span>{profile.location}</span>}
        </div>
      </div>

      <hr className="border-gray-300 mb-4" />

      {/* Left-aligned sections below centred header */}
      <div className="text-left">
        {experiences.length > 0 && (
          <section className="mb-4">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-2">
              Experience
            </h2>
            {experiences.map((exp) => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between">
                  <span className="font-medium">{exp.role}</span>
                  <span className="text-[10px] text-gray-400">
                    {formatDate(exp.start_date)} – {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mb-0.5">{exp.company}</p>
                {exp.bullets.map((b, i) => (
                  <p key={i} className="text-[10px] text-gray-600 pl-3 before:content-['—'] before:mr-1.5">{b}</p>
                ))}
              </div>
            ))}
          </section>
        )}

        {skills.length > 0 && (
          <section className="mb-4">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Skills</h2>
            <p className="text-[10px] text-gray-600">{skills.map((s) => s.name).join('  ·  ')}</p>
          </section>
        )}

        {education.length > 0 && (
          <section className="mb-4">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Education</h2>
            {education.map((edu) => (
              <div key={edu.id} className="mb-1">
                <span className="font-medium">{edu.degree} in {edu.field}</span>
                <p className="text-[10px] text-gray-500">{edu.institution}</p>
              </div>
            ))}
          </section>
        )}

        {projects.length > 0 && (
          <section>
            <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">Projects</h2>
            {projects.map((proj) => (
              <div key={proj.id} className="mb-1.5">
                <span className="font-medium">{proj.name}</span>
                <p className="text-[10px] text-gray-500">{proj.description}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

const LAYOUT_MAP: Record<TemplateId, React.FC<{ profile: MasterProfile }>> = {
  classic: ClassicLayout,
  modern: ModernLayout,
  compact: CompactLayout,
  minimal: MinimalLayout,
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function CVPreview({ masterProfile, templateId, baseText: _baseText }: CVPreviewProps) {
  const printStyleRef = useRef<HTMLStyleElement | null>(null)

  // Inject print style once on mount
  useEffect(() => {
    if (printStyleRef.current) return
    const style = document.createElement('style')
    style.textContent = PRINT_STYLE
    document.head.appendChild(style)
    printStyleRef.current = style
    return () => {
      document.head.removeChild(style)
      printStyleRef.current = null
    }
  }, [])

  function handleDownload() {
    window.print()
  }

  const activeTemplateId: TemplateId = templateId ?? 'classic'
  const LayoutComponent = LAYOUT_MAP[activeTemplateId]

  const isEmpty =
    !masterProfile.profile?.full_name &&
    masterProfile.experiences.length === 0 &&
    masterProfile.skills.length === 0

  return (
    <div
      className="flex flex-col gap-4 h-full"
      id="cv-print-root"
      aria-label="CV preview"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="label mb-0">Live preview</p>
          <p className="text-[11px] text-[#71717A] mt-0.5">
            Template:{' '}
            <span className="font-mono text-[#A1A1AA] capitalize">{activeTemplateId}</span>
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="btn-secondary text-xs gap-1.5 px-3"
          aria-label="Download CV as PDF (opens print dialog)"
        >
          <svg
            aria-hidden="true"
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 16 16"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              d="M3 11v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2M8 3v7M5 8l3 3 3-3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Preview paper */}
      <div
        className="flex-1 overflow-y-auto rounded-xl border border-[#27272A] bg-white p-4 shadow-lg"
        style={{ minHeight: '400px' }}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <svg
              aria-hidden="true"
              className="w-8 h-8 text-gray-300 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-gray-400 font-mono">
              Complete your profile to see the preview
            </p>
          </div>
        ) : (
          <LayoutComponent profile={masterProfile} />
        )}
      </div>
    </div>
  )
}
