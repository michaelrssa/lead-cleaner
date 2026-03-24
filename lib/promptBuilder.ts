import type { ColumnMapping } from '@/types'

/**
 * Build the system prompt for the pre-scan phase.
 * Claude analyses 10 sample rows to identify patterns.
 */
export function buildPreScanPrompt(
  mapping: ColumnMapping,
  allHeaders: string[],
): string {
  const mapped = Object.entries(mapping).filter(([, t]) => t !== 'Ignore this column')
  const ignored = allHeaders.filter((h) => mapping[h] === 'Ignore this column' || !mapping[h])

  return `You are a data cleaning assistant. You will receive sample rows from a lead/contact spreadsheet.

Your job is to analyse the data and identify patterns that will help clean the full dataset.

## Column Mapping
The user has mapped these columns to target fields:
${mapped.map(([src, tgt]) => `- "${src}" → ${tgt}`).join('\n')}

${ignored.length > 0 ? `## Context Columns (not mapped, but may contain useful info)
${ignored.map((h) => `- "${h}"`).join('\n')}` : ''}

## Instructions
1. Look at ALL columns (mapped and unmapped) to understand the data
2. Identify patterns like:
   - Abbreviated first names that can be inferred from other fields (e.g. booking name)
   - Inconsistent formatting patterns
   - Fields that contain data belonging to other fields
   - Common data quality issues in this dataset
3. Return a JSON object with this structure:
{
  "patterns": ["description of each pattern found"],
  "cleaning_rules": ["specific rule for cleaning, e.g. 'When First Name is a single letter, check Full Name / Booking Name for the complete first name'"],
  "notes": "any other observations"
}

Return ONLY the JSON object, no markdown fences or extra text.`
}

/**
 * Build the system prompt for batch cleaning.
 * Includes patterns discovered during pre-scan.
 */
export function buildCleaningSystemPrompt(
  mapping: ColumnMapping,
  allHeaders: string[],
  preScanRules: string[],
): string {
  const mapped = Object.entries(mapping).filter(([, t]) => t !== 'Ignore this column')
  const ignored = allHeaders.filter((h) => mapping[h] === 'Ignore this column' || !mapping[h])
  const outputFields = mapped.map(([, t]) => t)

  return `You are a data cleaning assistant. You will receive batches of lead/contact rows as JSON arrays.

## Column Mapping
${mapped.map(([src, tgt]) => `- "${src}" → ${tgt}`).join('\n')}

${ignored.length > 0 ? `## Context Columns (unmapped but available for reference)
${ignored.map((h) => `- "${h}"`).join('\n')}

IMPORTANT: Use these context columns to infer missing or abbreviated data in mapped fields.` : ''}

## Cleaning Rules (from data analysis)
${preScanRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Output Requirements
For each input row, output a cleaned object with ONLY these keys:
${outputFields.map((f) => `- "${f}"`).join('\n')}

Apply these standards:
- **Names**: Proper case (John Smith, not JOHN SMITH or john smith). If a first name is abbreviated/initial, try to infer the full name from context columns.
- **Email**: Lowercase, trimmed.
- **Phone/Cell**: Keep as-is but trim whitespace. Do not invent numbers.
- **Company**: Proper case, fix obvious typos if confident.
- **Title/Salutation**: Standardise (Mr, Mrs, Ms, Dr, Prof).
- **Date of Birth**: Keep original format but fix obvious errors.
- **ID Number**: Keep as-is, trim whitespace.
- If a field is genuinely empty and cannot be inferred, use an empty string "".
- NEVER invent data. Only infer from what's available in the row.

## Response Format
Return a JSON array of cleaned objects, one per input row, in the same order.
Return ONLY the JSON array, no markdown fences or extra text.`
}

/**
 * Build the user message for a batch of rows.
 */
export function buildBatchUserMessage(
  rows: Record<string, string>[],
): string {
  return JSON.stringify(rows)
}
