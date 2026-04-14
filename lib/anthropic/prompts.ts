import type { MasterProfile, CVType, InterviewRound } from '@/types'

const SYSTEM_PROMPT = `You are a professional CV writer, cover letter specialist, and career coach.
You write precise, achievement-focused content tailored to specific job descriptions.
You never include filler phrases, clichés, or generic statements.
You always output only the final content with no preamble, explanation, or commentary.`

export function buildCVPrompt(profile: MasterProfile, jobDescription: string, cvType: CVType): string {
  const tone = cvType === 'career'
    ? 'professional, strategic, achievement-focused. Use strong action verbs and quantifiable outcomes.'
    : 'practical, reliability-focused, availability-driven. Emphasise adaptability and hands-on competence.'

  return `${SYSTEM_PROMPT}

Profile: ${JSON.stringify(profile, null, 2)}

Job Description:
${jobDescription}

CV Type: ${cvType}
Tone: ${tone}

Task: Generate a complete, tailored CV for this specific job. Structure it as:
1. Professional Summary (3–4 sentences)
2. Work Experience (most recent first, 3–5 bullets per role using STAR format)
3. Skills (grouped by category)
4. Education
5. Projects (if relevant)

Rules:
- Match language from the job description where authentic
- Emphasise experience most relevant to this specific role
- Every bullet must demonstrate impact or outcome
- Keep total length appropriate for the role seniority
- Output only the CV content in clean markdown format`
}

export function buildCoverLetterPrompt(profile: MasterProfile, jobDescription: string, cvType: CVType): string {
  const tone = cvType === 'career'
    ? 'professional, strategic, and confident'
    : 'direct, practical, and reliability-focused'

  return `${SYSTEM_PROMPT}

Profile: ${JSON.stringify(profile, null, 2)}

Job Description:
${jobDescription}

CV Type: ${cvType}
Tone: ${tone}

Task: Write a compelling cover letter for this specific role. Structure:
1. Opening: Hook that references the specific role/company and a clear value proposition
2. Body (2 paragraphs): Most relevant experience and achievements for THIS job
3. Closing: Confident call to action

Rules:
- Address the specific requirements in the job description
- Never use "I am writing to apply for..." or other clichéd openings
- Maximum 350 words
- Output only the letter body (no date/address headers), in plain text`
}

export function buildInterviewQuestionsPrompt(
  profile: MasterProfile,
  jobDescription: string,
  round: InterviewRound
): string {
  const roundGuide = {
    basic: 'foundational questions about background, motivations, and general competencies (5–8 questions)',
    intermediate: 'technical and situational questions specific to the role (5–8 questions)',
    advanced: 'deep technical, leadership, and strategic thinking questions (5–8 questions)',
  }[round]

  return `${SYSTEM_PROMPT}

Profile: ${JSON.stringify(profile, null, 2)}

Job Description:
${jobDescription}

Round: ${round} — ${roundGuide}

Task: Generate realistic interview questions an interviewer would ask for this specific role.
Output as a JSON array of strings. No preamble. Only the JSON array.
Example: ["Question 1?", "Question 2?"]`
}

export function buildInterviewAnswerPrompt(
  profile: MasterProfile,
  jobDescription: string,
  question: string
): string {
  return `${SYSTEM_PROMPT}

Profile: ${JSON.stringify(profile, null, 2)}

Job Description:
${jobDescription}

Interview Question: ${question}

Task: Write a strong, specific answer to this interview question using the STAR method where applicable.
Draw only from the actual profile data provided.
Maximum 200 words. Output only the answer.`
}

export function buildFollowUpPrompt(
  profile: MasterProfile,
  job: { title: string; company: string; applied_at: string | null }
): string {
  const appliedDate = job.applied_at
    ? new Date(job.applied_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'recently'

  return `${SYSTEM_PROMPT}

Applicant: ${profile.profile.full_name}
Role: ${job.title} at ${job.company}
Applied: ${appliedDate}

Task: Write a brief, professional follow-up email to check on the status of this application.

Rules:
- Subject line on first line: "Subject: Follow-up — [Role] Application"
- Polite, direct, no desperation
- Reference application date
- Offer availability for next steps
- Maximum 120 words for the body
- Output subject line then body, plain text only`
}
