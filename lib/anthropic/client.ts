import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const AI_MODEL = 'claude-sonnet-4-20250514'
export const MAX_TOKENS_DEFAULT = 2000
export const MAX_TOKENS_CV = 4000
