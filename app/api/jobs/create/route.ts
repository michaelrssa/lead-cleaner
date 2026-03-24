import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { runCleaningPipeline } from '@/lib/cleaningPipeline'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      filename,
      totalRows,
      columnMapping,
      modelStrategy,
      budgetCapUsd,
      estimatedCostUsd,
      rows,
      headers,
    } = body

    const supabase = createSupabaseServer()

    // 1. Insert job
    const { data: job, error: jobError } = await supabase
      .from('cleaning_jobs')
      .insert({
        original_filename: filename,
        total_rows: totalRows,
        column_mapping: columnMapping,
        model_strategy: modelStrategy || 'haiku_primary',
        budget_cap_usd: budgetCapUsd,
        estimated_cost_usd: estimatedCostUsd,
      })
      .select('id')
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Failed to create job', details: jobError?.message },
        { status: 500 },
      )
    }

    // 2. Insert all rows as pending
    const rowInserts = rows.map((row: Record<string, string>, i: number) => ({
      job_id: job.id,
      row_index: i,
      raw_data: row,
    }))

    // Insert in chunks of 500 to avoid payload limits
    for (let i = 0; i < rowInserts.length; i += 500) {
      const chunk = rowInserts.slice(i, i + 500)
      const { error: rowError } = await supabase.from('lead_rows').insert(chunk)
      if (rowError) {
        console.error('Row insert error:', rowError)
      }
    }

    // 3. Start cleaning pipeline (fire-and-forget)
    runCleaningPipeline({
      jobId: job.id,
      rows,
      headers,
      mapping: columnMapping,
      modelStrategy: modelStrategy || 'haiku_primary',
      budgetCapUsd: budgetCapUsd || 20,
    }).catch((err) => console.error('Pipeline error:', err))

    return NextResponse.json({ jobId: job.id })
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid request', details: (err as Error).message },
      { status: 400 },
    )
  }
}
