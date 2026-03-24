import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParsedFile {
  headers: string[]
  rows: Record<string, string>[]
  filename: string
  totalRows: number
}

function cleanHeader(h: string): string {
  return h.replace(/\s+/g, ' ').trim()
}

function cleanRow(row: Record<string, string>, headers: string[]): Record<string, string> {
  const cleaned: Record<string, string> = {}
  for (const h of headers) {
    cleaned[h] = (row[h] ?? '').toString().trim()
  }
  return cleaned
}

function isEmptyRow(row: Record<string, string>): boolean {
  return Object.values(row).every((v) => !v || !v.toString().trim())
}

export function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: cleanHeader,
      complete(results) {
        const headers = (results.meta.fields ?? []).filter(Boolean)
        const rows = (results.data as Record<string, string>[])
          .map((row) => cleanRow(row, headers))
          .filter((row) => !isEmptyRow(row))

        resolve({
          headers,
          rows,
          filename: file.name,
          totalRows: rows.length,
        })
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`))
      },
    })
  })
}

export function parseXLSX(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        // Unmerge cells before converting
        if (sheet['!merges']) {
          for (const merge of sheet['!merges']) {
            const cellRef = XLSX.utils.encode_cell(merge.s)
            const val = sheet[cellRef]?.v ?? ''
            for (let r = merge.s.r; r <= merge.e.r; r++) {
              for (let c = merge.s.c; c <= merge.e.c; c++) {
                const ref = XLSX.utils.encode_cell({ r, c })
                if (!sheet[ref]) sheet[ref] = { t: 's', v: val }
              }
            }
          }
        }

        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          defval: '',
          raw: false,
        })

        if (!jsonData.length) {
          resolve({ headers: [], rows: [], filename: file.name, totalRows: 0 })
          return
        }

        const headers = Object.keys(jsonData[0]).map(cleanHeader).filter(Boolean)
        const rows = jsonData
          .map((row) => {
            const cleaned: Record<string, string> = {}
            const rawKeys = Object.keys(row)
            for (let i = 0; i < rawKeys.length; i++) {
              const header = cleanHeader(rawKeys[i])
              if (header) cleaned[header] = (row[rawKeys[i]] ?? '').toString().trim()
            }
            return cleaned
          })
          .filter((row) => !isEmptyRow(row))

        resolve({
          headers,
          rows,
          filename: file.name,
          totalRows: rows.length,
        })
      } catch (err) {
        reject(new Error(`XLSX parse error: ${(err as Error).message}`))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return parseCSV(file)
  if (ext === 'xlsx' || ext === 'xls') return parseXLSX(file)
  throw new Error(`Unsupported file type: .${ext}`)
}
