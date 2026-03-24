'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatUSD } from '@/lib/costCalculator'
import type { CleaningJob } from '@/types'

export default function ProgressPage() {
  const router = useRouter()
  const [job, setJob] = useState<CleaningJob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const jobId = typeof window !== 'undefined' ? localStorage.getItem('lc_job_id') : null

  const fetchStatus = useCallback(async () => {
    if (!jobId) return
    try {
      const res = await fetch(`/api/jobs/status?jobId=${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setJob(data)
    } catch {
      setError('Failed to fetch job status')
    }
  }, [jobId])

  // Poll every 2 seconds
  useEffect(() => {
    if (!jobId) {
      router.replace('/')
      return
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [jobId, fetchStatus, router])

  // Stop polling when complete/failed/cancelled
  const isTerminal = job?.status === 'complete' || job?.status === 'failed' || job?.status === 'cancelled'

  useEffect(() => {
    if (!isTerminal) return
    // One final fetch, then stop
  }, [isTerminal])

  const handleCancel = async () => {
    if (!jobId) return
    await fetch('/api/jobs/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    })
    fetchStatus()
  }

  if (!jobId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">No active job. <button onClick={() => router.push('/')} className="text-blue-400 hover:underline">Upload a file</button></p>
      </div>
    )
  }

  const progress = job && job.total_rows
    ? Math.round((job.processed_rows / job.total_rows) * 100)
    : 0

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending: { text: 'Pending', color: 'text-yellow-400' },
    processing: { text: 'Processing', color: 'text-blue-400' },
    paused: { text: 'Paused (budget limit)', color: 'text-orange-400' },
    complete: { text: 'Complete', color: 'text-green-400' },
    cancelled: { text: 'Cancelled', color: 'text-zinc-400' },
    failed: { text: 'Failed', color: 'text-red-400' },
  }

  const status = job ? statusLabel[job.status] ?? { text: job.status, color: 'text-zinc-400' } : null

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 font-[family-name:var(--font-geist-sans)]">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          Cleaning Progress
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {job?.original_filename ?? 'Loading...'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {job && (
        <div className="space-y-6">
          {/* Status */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Status
              </h2>
              {status && (
                <span className={`text-sm font-medium ${status.color}`}>
                  {status.text}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="h-2 w-full rounded-full bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>
                {job.processed_rows.toLocaleString()} / {(job.total_rows ?? 0).toLocaleString()} rows
              </span>
              <span>{progress}%</span>
            </div>
          </div>

          {/* Cost tracking */}
          <div className="card">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Cost
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-zinc-500">Estimated</p>
                <p className="mt-0.5 text-sm font-medium text-zinc-300">
                  {formatUSD(job.estimated_cost_usd ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Actual so far</p>
                <p className="mt-0.5 text-sm font-medium text-zinc-200">
                  {formatUSD(job.actual_cost_usd)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Budget cap</p>
                <p className="mt-0.5 text-sm font-medium text-zinc-300">
                  {formatUSD(job.budget_cap_usd ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {job.status === 'processing' && (
              <button onClick={handleCancel} className="btn-secondary">
                Cancel Job
              </button>
            )}
            {job.status === 'complete' && (
              <button
                onClick={() => router.push('/results')}
                className="btn-primary"
              >
                View Results &rarr;
              </button>
            )}
            {(job.status === 'failed' || job.status === 'cancelled') && (
              <button
                onClick={() => router.push('/')}
                className="btn-secondary"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
