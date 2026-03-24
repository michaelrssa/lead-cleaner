'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LeadRow } from '@/types'

export default function ResultsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)

  const jobId = typeof window !== 'undefined' ? localStorage.getItem('lc_job_id') : null

  useEffect(() => {
    if (!jobId) {
      router.replace('/')
      return
    }
    fetch(`/api/jobs/results?jobId=${jobId}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [jobId, router])

  const cleanedRows = rows.filter((r) => r.status === 'done' && r.cleaned_data)
  const errorRows = rows.filter((r) => r.status === 'error')

  // Get output column headers from first cleaned row
  const outputHeaders = cleanedRows[0]
    ? Object.keys(cleanedRows[0].cleaned_data!)
    : []

  const downloadCSV = () => {
    if (!outputHeaders.length || !cleanedRows.length) return
    const csvRows = [outputHeaders.join(',')]
    for (const row of cleanedRows) {
      const vals = outputHeaders.map((h) => {
        const v = (row.cleaned_data?.[h] ?? '').replace(/"/g, '""')
        return `"${v}"`
      })
      csvRows.push(vals.join(','))
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cleaned_leads_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading results...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push('/progress')}
            className="mb-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            &larr; Back to progress
          </button>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            Cleaned Results
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {cleanedRows.length.toLocaleString()} rows cleaned
            {errorRows.length > 0 && (
              <span className="text-red-400">
                {' '}&middot; {errorRows.length} errors
              </span>
            )}
          </p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={cleanedRows.length === 0}
          className="btn-primary"
        >
          Download CSV
        </button>
      </div>

      {/* Results table */}
      {outputHeaders.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    #
                  </th>
                  {outputHeaders.map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cleanedRows.slice(0, 100).map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-800/50 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-zinc-500">
                      {row.row_index + 1}
                    </td>
                    {outputHeaders.map((h) => (
                      <td
                        key={h}
                        className="whitespace-nowrap px-4 py-2 text-zinc-300"
                      >
                        {row.cleaned_data?.[h] || (
                          <span className="text-zinc-600">&mdash;</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cleanedRows.length > 100 && (
            <div className="border-t border-zinc-800 px-6 py-3 text-center text-xs text-zinc-500">
              Showing first 100 of {cleanedRows.length.toLocaleString()} rows &middot; Download CSV for full data
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-sm text-zinc-500">No cleaned results available yet.</p>
        </div>
      )}

      {/* Start over */}
      <div className="mt-6 flex justify-end">
        <button onClick={() => router.push('/')} className="btn-secondary">
          Clean Another File
        </button>
      </div>
    </div>
  )
}
