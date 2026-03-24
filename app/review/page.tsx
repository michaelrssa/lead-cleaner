'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { estimateCost, formatUSD, MODELS, type ModelStrategy } from '@/lib/costCalculator'
import type { ColumnMapping, ParsedFile } from '@/types'

export default function ReviewPage() {
  const router = useRouter()
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [strategy, setStrategy] = useState<ModelStrategy>('haiku_primary')
  const [budgetCap, setBudgetCap] = useState<string>('20.00')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const rawParsed = localStorage.getItem('lc_parsed')
    const rawMapping = localStorage.getItem('lc_mapping')
    if (!rawParsed || !rawMapping) {
      router.replace('/')
      return
    }
    try {
      setParsed(JSON.parse(rawParsed))
      setMapping(JSON.parse(rawMapping))
    } catch {
      router.replace('/')
    }
  }, [router])

  if (!parsed || !mapping) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    )
  }

  const activeMappings = Object.entries(mapping).filter(
    ([, target]) => target !== 'Ignore this column',
  )
  const ignoredCount = Object.keys(mapping).length - activeMappings.length
  const cost = estimateCost(parsed.totalRows, strategy)
  const budgetNum = parseFloat(budgetCap) || 0
  const overBudget = cost.totalCost > budgetNum

  const handleSubmit = async () => {
    if (overBudget || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: parsed.filename,
          totalRows: parsed.totalRows,
          columnMapping: Object.fromEntries(activeMappings),
          modelStrategy: strategy,
          budgetCapUsd: budgetNum,
          estimatedCostUsd: cost.totalCost,
        }),
      })
      if (!res.ok) throw new Error('Failed to create job')
      const data = await res.json()
      // Store job ID for progress page
      localStorage.setItem('lc_job_id', data.jobId ?? data.id ?? '')
      router.push('/progress')
    } catch (err) {
      console.error(err)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <div className="mb-10">
        <button
          onClick={() => router.push('/map')}
          className="mb-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; Back to mapping
        </button>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          Review &amp; Estimate Cost
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Confirm your settings before submitting the cleaning job.
        </p>
      </div>

      <div className="space-y-6">
        {/* File summary */}
        <div className="card">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
            File
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Filename</p>
              <p className="mt-0.5 text-sm font-medium text-zinc-200 truncate">
                {parsed.filename}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total Rows</p>
              <p className="mt-0.5 text-sm font-medium text-zinc-200">
                {parsed.totalRows.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Columns</p>
              <p className="mt-0.5 text-sm font-medium text-zinc-200">
                {activeMappings.length} mapped, {ignoredCount} ignored
              </p>
            </div>
          </div>
        </div>

        {/* Column mappings */}
        <div className="card">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Column Mappings
          </h2>
          <div className="space-y-2">
            {activeMappings.map(([source, target]) => (
              <div
                key={source}
                className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-2.5"
              >
                <span className="text-sm text-zinc-300 truncate mr-4">{source}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <svg
                    className="h-3.5 w-3.5 text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                  <span className="text-sm font-medium text-blue-400">
                    {target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model + Budget */}
        <div className="card">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Processing Settings
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">
                Model Strategy
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as ModelStrategy)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {Object.entries(MODELS).map(([key, model]) => (
                  <option key={key} value={key}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">
                Budget Cap (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetCap}
                  onChange={(e) => setBudgetCap(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-7 pr-3 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cost estimate */}
        <div className={`card border ${overBudget ? 'border-red-800/50' : 'border-zinc-800'}`}>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Cost Estimate
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-zinc-500">Input tokens</p>
              <p className="mt-0.5 text-sm text-zinc-300">
                ~{(parsed.totalRows * 200).toLocaleString()} tokens
              </p>
              <p className="text-xs text-zinc-500">{formatUSD(cost.inputCost)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Output tokens</p>
              <p className="mt-0.5 text-sm text-zinc-300">
                ~{(parsed.totalRows * 150).toLocaleString()} tokens
              </p>
              <p className="text-xs text-zinc-500">{formatUSD(cost.outputCost)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Model</p>
              <p className="mt-0.5 text-sm text-zinc-300">{cost.model}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
            <p className="text-sm text-zinc-400">Estimated total</p>
            <p className={`text-xl font-semibold ${overBudget ? 'text-red-400' : 'text-zinc-100'}`}>
              {formatUSD(cost.totalCost)}
            </p>
          </div>
          {overBudget && (
            <p className="mt-2 text-xs text-red-400">
              Estimated cost exceeds your budget cap of {formatUSD(budgetNum)}.
              Increase the cap or switch to a cheaper model.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => router.push('/map')}
            className="btn-secondary"
          >
            &larr; Edit Mapping
          </button>
          <button
            onClick={handleSubmit}
            disabled={overBudget || submitting}
            className="btn-primary"
          >
            {submitting ? 'Creating job...' : 'Submit Cleaning Job'}
          </button>
        </div>
      </div>
    </div>
  )
}
