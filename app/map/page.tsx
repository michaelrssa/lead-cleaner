'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { suggestMapping } from '@/lib/autoMapper'
import { MAPPING_TARGETS, type ColumnMapping, type MappingTarget, type ParsedFile } from '@/types'

export default function MapPage() {
  const router = useRouter()
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({})

  // Load parsed data from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('lc_parsed')
    if (!raw) {
      router.replace('/')
      return
    }
    try {
      const data: ParsedFile = JSON.parse(raw)
      setParsed(data)

      // Auto-suggest mappings
      const initial: ColumnMapping = {}
      for (const header of data.headers) {
        const suggestion = suggestMapping(header)
        initial[header] = suggestion ?? 'Ignore this column'
      }
      setMapping(initial)
    } catch {
      router.replace('/')
    }
  }, [router])

  const setColumnMapping = (header: string, target: MappingTarget) => {
    setMapping((prev) => ({ ...prev, [header]: target }))
  }

  // Validation: at least one column must be mapped (not ignored)
  const mappedCount = useMemo(
    () => Object.values(mapping).filter((v) => v !== 'Ignore this column').length,
    [mapping],
  )

  const canProceed = mappedCount > 0

  const handleContinue = () => {
    if (!parsed || !canProceed) return
    localStorage.setItem('lc_mapping', JSON.stringify(mapping))
    router.push('/review')
  }

  if (!parsed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    )
  }

  const previewRows = parsed.rows.slice(0, 3)

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <div className="mb-10">
        <button
          onClick={() => router.push('/')}
          className="mb-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; Back to upload
        </button>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          Map Columns
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Match each column from{' '}
          <span className="font-medium text-zinc-300">{parsed.filename}</span>{' '}
          to a target field, or ignore columns you don&apos;t need.
        </p>
      </div>

      {/* Mapping grid */}
      <div className="card mb-8 p-0">
        <div className="border-b border-zinc-800 px-6 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Column Mapping
          </p>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {parsed.headers.map((header) => {
            const isIgnored = mapping[header] === 'Ignore this column'
            return (
              <div
                key={header}
                className={`flex items-center justify-between gap-6 px-6 py-3.5 transition-colors ${
                  isIgnored ? 'opacity-40' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {header}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    e.g. {previewRows[0]?.[header] || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="h-4 w-4 shrink-0 text-zinc-600"
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
                  <select
                    value={mapping[header] ?? 'Ignore this column'}
                    onChange={(e) =>
                      setColumnMapping(header, e.target.value as MappingTarget)
                    }
                    className={`w-56 rounded-lg border bg-zinc-800 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isIgnored
                        ? 'border-zinc-700 text-zinc-500'
                        : 'border-zinc-600 text-zinc-200'
                    }`}
                  >
                    {MAPPING_TARGETS.map((target) => (
                      <option key={target} value={target}>
                        {target}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Data preview */}
      <div className="card mb-8 overflow-hidden p-0">
        <div className="border-b border-zinc-800 px-6 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Data Preview &mdash; first 3 rows
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {parsed.headers.map((h) => {
                  const target = mapping[h]
                  const isIgnored = target === 'Ignore this column'
                  return (
                    <th
                      key={h}
                      className={`whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider ${
                        isIgnored ? 'text-zinc-700 line-through' : 'text-zinc-500'
                      }`}
                    >
                      <div>{h}</div>
                      {!isIgnored && target && (
                        <div className="mt-0.5 text-[10px] font-normal normal-case tracking-normal text-blue-400">
                          &rarr; {target}
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-800/50 last:border-0"
                >
                  {parsed.headers.map((h) => {
                    const isIgnored = mapping[h] === 'Ignore this column'
                    return (
                      <td
                        key={h}
                        className={`whitespace-nowrap px-4 py-2 ${
                          isIgnored ? 'text-zinc-700' : 'text-zinc-300'
                        }`}
                      >
                        {row[h] || (
                          <span className="text-zinc-600">&mdash;</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {mappedCount} of {parsed.headers.length} columns mapped
        </p>
        <button
          onClick={handleContinue}
          disabled={!canProceed}
          className="btn-primary"
        >
          Review &amp; Estimate Cost &rarr;
        </button>
      </div>
    </div>
  )
}
