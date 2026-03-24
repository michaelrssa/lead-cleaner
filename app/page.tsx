'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseFile } from '@/lib/fileParser'
import type { ParsedFile } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedFile | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setParsing(true)
    try {
      const result = await parseFile(file)
      if (result.totalRows === 0) {
        setError('File is empty or has no data rows.')
        setParsing(false)
        return
      }
      setParsed(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setParsing(false)
    }
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const goToMap = () => {
    if (!parsed) return
    localStorage.setItem('lc_parsed', JSON.stringify(parsed))
    router.push('/map')
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          Lead Cleaner
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Upload a CSV or Excel file to clean and standardise your lead data using AI.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`card flex cursor-pointer flex-col items-center justify-center gap-3 border-dashed py-16 transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-zinc-700 hover:border-zinc-500'
        }`}
      >
        <svg
          className="h-10 w-10 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-300">
            {parsing ? 'Parsing file...' : 'Drag and drop your file here'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            or click to browse &middot; .csv and .xlsx supported
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onFileSelect}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* File info + preview */}
      {parsed && (
        <div className="mt-8 space-y-6">
          {/* File summary */}
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {parsed.filename}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {parsed.totalRows.toLocaleString()} rows &middot;{' '}
                {parsed.headers.length} columns
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setParsed(null)
                setError(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Remove
            </button>
          </div>

          {/* Data preview */}
          <div className="card overflow-hidden p-0">
            <div className="border-b border-zinc-800 px-6 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Preview &mdash; first 5 rows
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {parsed.headers.map((h) => (
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
                  {parsed.rows.slice(0, 5).map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-zinc-800/50 last:border-0"
                    >
                      {parsed.headers.map((h) => (
                        <td
                          key={h}
                          className="whitespace-nowrap px-4 py-2 text-zinc-300"
                        >
                          {row[h] || (
                            <span className="text-zinc-600">&mdash;</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action */}
          <div className="flex justify-end">
            <button onClick={goToMap} className="btn-primary">
              Map Columns &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
