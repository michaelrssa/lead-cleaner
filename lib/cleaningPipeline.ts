import { anthropic } from '@/lib/anthropic'
import { createSupabaseServer } from '@/lib/supabase'
import {
  buildPreScanPrompt,
  buildCleaningSystemPrompt,
  buildBatchUserMessage,
} from '@/lib/promptBuilder'
import type { ColumnMapping } from '@/types'

const BATCH_SIZE = 25
const MODEL_MAP: Record<string, string> = {
  haiku_primary: 'claude-haiku-4-5-20251001',
  sonnet_primary: 'claude-sonnet-4-5-20250514',
}

interface PipelineInput {
  jobId: string
  rows: Record<string, string>[]
  headers: string[]
  mapping: ColumnMapping
  modelStrategy: string
  budgetCapUsd: number
}

/**
 * Run the pre-scan phase: send 10 sample rows to identify patterns.
 */
async function preScan(
  rows: Record<string, string>[],
  headers: string[],
  mapping: ColumnMapping,
  model: string,
  jobId: string,
): Promise<string[]> {
  const sampleRows = rows.slice(0, Math.min(10, rows.length))
  const systemPrompt = buildPreScanPrompt(mapping, headers)

  const response = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: JSON.stringify(sampleRows) }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Log usage
  const supabase = createSupabaseServer()
  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const cost = calculateCost(model, inputTokens, outputTokens)

  await supabase.from('api_usage_log').insert({
    job_id: jobId,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: cost,
    batch_index: -1, // pre-scan
  })

  await supabase
    .from('cleaning_jobs')
    .update({ actual_cost_usd: cost })
    .eq('id', jobId)

  try {
    const parsed = JSON.parse(text)
    return parsed.cleaning_rules ?? []
  } catch {
    return ['Clean and standardise all fields using proper casing and formatting.']
  }
}

/**
 * Clean a single batch of rows via Claude.
 */
async function cleanBatch(
  rows: Record<string, string>[],
  systemPrompt: string,
  model: string,
  jobId: string,
  batchIndex: number,
): Promise<Record<string, string>[]> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: buildBatchUserMessage(rows) }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'

  // Log usage
  const supabase = createSupabaseServer()
  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const cost = calculateCost(model, inputTokens, outputTokens)

  await supabase.from('api_usage_log').insert({
    job_id: jobId,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: cost,
    batch_index: batchIndex,
  })

  try {
    return JSON.parse(text)
  } catch {
    return rows.map(() => ({}))
  }
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const isHaiku = model.includes('haiku')
  const inputRate = isHaiku ? 0.25 : 3.0
  const outputRate = isHaiku ? 1.25 : 15.0
  return (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000
}

/**
 * Main pipeline: pre-scan → batch clean → update DB.
 * Runs as a background async process (fire-and-forget from the API route).
 */
export async function runCleaningPipeline(input: PipelineInput) {
  const { jobId, rows, headers, mapping, modelStrategy, budgetCapUsd } = input
  const supabase = createSupabaseServer()
  const model = MODEL_MAP[modelStrategy] ?? MODEL_MAP.haiku_primary

  try {
    // Update status to processing
    await supabase
      .from('cleaning_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId)

    // 1. Pre-scan
    const rules = await preScan(rows, headers, mapping, model, jobId)

    // 2. Build cleaning prompt with discovered rules
    const systemPrompt = buildCleaningSystemPrompt(mapping, headers, rules)

    // 3. Process in batches
    const batches: Record<string, string>[][] = []
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      batches.push(rows.slice(i, i + BATCH_SIZE))
    }

    let totalProcessed = 0
    let totalCostSoFar = 0

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      // Check if job was cancelled
      const { data: job } = await supabase
        .from('cleaning_jobs')
        .select('status, actual_cost_usd')
        .eq('id', jobId)
        .single()

      if (job?.status === 'cancelled') break

      totalCostSoFar = job?.actual_cost_usd ?? 0

      // Budget check
      if (totalCostSoFar >= budgetCapUsd) {
        await supabase
          .from('cleaning_jobs')
          .update({ status: 'paused' })
          .eq('id', jobId)
        break
      }

      const batch = batches[batchIdx]
      const startIndex = batchIdx * BATCH_SIZE

      // Mark rows as cleaning
      const rowIds: string[] = []
      for (let i = 0; i < batch.length; i++) {
        const { data } = await supabase
          .from('lead_rows')
          .select('id')
          .eq('job_id', jobId)
          .eq('row_index', startIndex + i)
          .single()
        if (data) rowIds.push(data.id)
      }

      if (rowIds.length > 0) {
        await supabase
          .from('lead_rows')
          .update({ status: 'cleaning' })
          .in('id', rowIds)
      }

      // Clean the batch
      const cleaned = await cleanBatch(batch, systemPrompt, model, jobId, batchIdx)

      // Update each row with cleaned data
      for (let i = 0; i < batch.length; i++) {
        const rowIndex = startIndex + i
        const cleanedRow = cleaned[i] ?? {}

        await supabase
          .from('lead_rows')
          .update({
            cleaned_data: cleanedRow,
            status: Object.keys(cleanedRow).length > 0 ? 'done' : 'error',
            error_msg: Object.keys(cleanedRow).length > 0 ? null : 'Empty response from AI',
          })
          .eq('job_id', jobId)
          .eq('row_index', rowIndex)
      }

      totalProcessed += batch.length

      // Update job progress and cost
      const { data: costData } = await supabase
        .from('api_usage_log')
        .select('cost_usd')
        .eq('job_id', jobId)

      const actualCost = (costData ?? []).reduce((sum, r) => sum + r.cost_usd, 0)

      await supabase
        .from('cleaning_jobs')
        .update({
          processed_rows: totalProcessed,
          actual_cost_usd: actualCost,
        })
        .eq('id', jobId)
    }

    // Final status check
    const { data: finalJob } = await supabase
      .from('cleaning_jobs')
      .select('status')
      .eq('id', jobId)
      .single()

    if (finalJob?.status === 'processing') {
      await supabase
        .from('cleaning_jobs')
        .update({ status: 'complete' })
        .eq('id', jobId)
    }
  } catch (err) {
    console.error('Pipeline error:', err)
    await supabase
      .from('cleaning_jobs')
      .update({
        status: 'failed',
      })
      .eq('id', jobId)
  }
}
