/**
 * Cost calculation utilities for lead cleaning jobs.
 *
 * Estimates based on Claude token pricing:
 * - Haiku:  $0.25 / 1M input, $1.25 / 1M output
 * - Sonnet: $3.00 / 1M input, $15.00 / 1M output
 *
 * Rough estimate: ~200 input tokens + ~150 output tokens per lead.
 */

const MODELS = {
  haiku_primary: {
    label: 'Haiku (fast & cheap)',
    inputPer1M: 0.25,
    outputPer1M: 1.25,
  },
  sonnet_primary: {
    label: 'Sonnet (higher quality)',
    inputPer1M: 3.0,
    outputPer1M: 15.0,
  },
} as const

export type ModelStrategy = keyof typeof MODELS

const AVG_INPUT_TOKENS = 200
const AVG_OUTPUT_TOKENS = 150

export function estimateCost(
  leadCount: number,
  strategy: ModelStrategy = 'haiku_primary',
) {
  const model = MODELS[strategy]
  const inputCost = (leadCount * AVG_INPUT_TOKENS * model.inputPer1M) / 1_000_000
  const outputCost = (leadCount * AVG_OUTPUT_TOKENS * model.outputPer1M) / 1_000_000
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    model: model.label,
    strategy,
  }
}

export function formatUSD(amount: number): string {
  if (amount < 0.01) return `< $0.01`
  return `$${amount.toFixed(2)}`
}

export { MODELS }
