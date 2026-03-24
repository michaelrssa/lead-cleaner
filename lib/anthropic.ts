import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY

if (!apiKey) {
  console.warn('Missing ANTHROPIC_API_KEY environment variable')
}

/** Server-only Anthropic client — do not import in Client Components */
export const anthropic = new Anthropic({ apiKey: apiKey ?? '' })
