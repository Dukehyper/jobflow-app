/**
 * Unified AI client — supports Gemini, OpenAI, Groq, and Anthropic.
 * Configure via environment variables:
 *
 *   AI_PROVIDER=gemini          # gemini | openai | groq | anthropic
 *   AI_API_KEY=your_key_here
 *   AI_MODEL=gemini-2.0-flash   # optional — defaults shown below
 *
 * Free options:
 *   Gemini  → aistudio.google.com  (no credit card required)
 *   Groq    → console.groq.com     (generous free tier)
 */

export const MAX_TOKENS_DEFAULT = 2000
export const MAX_TOKENS_CV = 4000

type Provider = 'gemini' | 'openai' | 'groq' | 'anthropic'

const DEFAULT_MODELS: Record<Provider, string> = {
  gemini:    'gemini-2.0-flash',
  openai:    'gpt-4o-mini',
  groq:      'llama-3.1-70b-versatile',
  anthropic: 'claude-sonnet-4-20250514',
}

function getProvider(): Provider {
  const p = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase() as Provider
  if (!['gemini', 'openai', 'groq', 'anthropic'].includes(p)) {
    throw new Error(`Unknown AI_PROVIDER "${p}". Must be: gemini | openai | groq | anthropic`)
  }
  return p
}

function getModel(provider: Provider): string {
  return process.env.AI_MODEL ?? DEFAULT_MODELS[provider]
}

function getApiKey(): string {
  const key = process.env.AI_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? ''
  if (!key) {
    throw new Error('AI_API_KEY is not set. Add it to your .env.local file.')
  }
  return key
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

async function generateWithGemini(prompt: string, maxTokens: number): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(getApiKey())
  const model = genAI.getGenerativeModel({
    model: getModel('gemini'),
    generationConfig: { maxOutputTokens: maxTokens },
  })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ─── OpenAI / Groq (OpenAI-compatible) ───────────────────────────────────────

async function generateWithOpenAI(
  prompt: string,
  maxTokens: number,
  baseURL?: string
): Promise<string> {
  const { default: OpenAI } = await import('openai')
  const provider = getProvider()
  const client = new OpenAI({
    apiKey: getApiKey(),
    ...(baseURL ? { baseURL } : {}),
  })
  const response = await client.chat.completions.create({
    model: getModel(provider),
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from AI provider')
  return content
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

async function generateWithAnthropic(prompt: string, maxTokens: number): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: getApiKey() })
  const response = await client.messages.create({
    model: getModel('anthropic'),
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic')
  return block.text
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateText(
  prompt: string,
  maxTokens: number = MAX_TOKENS_DEFAULT
): Promise<string> {
  const provider = getProvider()

  switch (provider) {
    case 'gemini':
      return generateWithGemini(prompt, maxTokens)
    case 'openai':
      return generateWithOpenAI(prompt, maxTokens)
    case 'groq':
      return generateWithOpenAI(prompt, maxTokens, 'https://api.groq.com/openai/v1')
    case 'anthropic':
      return generateWithAnthropic(prompt, maxTokens)
  }
}
