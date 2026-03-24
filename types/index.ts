/** Types for the lead cleaner application */

// ── File parsing types ──────────────────────────────────────

export interface ParsedFile {
  headers: string[]
  rows: Record<string, string>[]
  filename: string
  totalRows: number
}

export const MAPPING_TARGETS = [
  'First Name',
  'Last Name',
  'Full Name / Booking Name',
  'Company Name',
  'Title/Salutation',
  'Phone/Cell',
  'Email',
  'Date of Birth',
  'ID Number',
  'Ignore this column',
] as const

export type MappingTarget = (typeof MAPPING_TARGETS)[number]

export type ColumnMapping = Record<string, MappingTarget>

// ── Supabase Database types ─────────────────────────────────

// ── Row types (match the database columns) ──────────────────

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'paused'
  | 'complete'
  | 'cancelled'
  | 'failed'

export interface CleaningJob {
  id: string
  created_at: string
  status: JobStatus
  total_rows: number | null
  processed_rows: number
  estimated_cost_usd: number | null
  actual_cost_usd: number
  budget_cap_usd: number | null
  anthropic_batch_id: string | null
  model_strategy: string
  column_mapping: Record<string, string> | null
  original_filename: string | null
  error_message: string | null
}

export interface ApiUsageLog {
  id: string
  job_id: string
  created_at: string
  model: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  batch_index: number | null
}

export interface MonthlySpend {
  month: string
  total_cost_usd: number
  monthly_cap_usd: number
}

export interface LeadRow {
  id: string
  job_id: string
  row_index: number
  raw_data: Record<string, string>
  cleaned_data: Record<string, string> | null
  status: 'pending' | 'cleaning' | 'done' | 'error'
  error_msg: string | null
  created_at: string
}

export type LeadRowInsert = Partial<Pick<LeadRow, 'id' | 'created_at' | 'status'>>
  & Omit<LeadRow, 'id' | 'created_at' | 'status' | 'cleaned_data' | 'error_msg'>

// ── Insert types (omit server-generated fields) ─────────────

export type CleaningJobInsert = Partial<Pick<CleaningJob,
  'id' | 'created_at' | 'status' | 'processed_rows' | 'actual_cost_usd' | 'model_strategy'
>> & Omit<CleaningJob,
  'id' | 'created_at' | 'status' | 'processed_rows' | 'actual_cost_usd' | 'model_strategy'
>

export type ApiUsageLogInsert = Partial<Pick<ApiUsageLog, 'id' | 'created_at'>>
  & Omit<ApiUsageLog, 'id' | 'created_at'>

export type MonthlySpendInsert = Partial<Pick<MonthlySpend, 'total_cost_usd' | 'monthly_cap_usd'>>
  & Pick<MonthlySpend, 'month'>

// ── Supabase Database type (for typed client) ───────────────

export interface CleaningJobUpdate {
  id?: string
  created_at?: string
  status?: JobStatus
  total_rows?: number | null
  processed_rows?: number
  estimated_cost_usd?: number | null
  actual_cost_usd?: number
  budget_cap_usd?: number | null
  anthropic_batch_id?: string | null
  model_strategy?: string
  column_mapping?: Record<string, string> | null
  original_filename?: string | null
  error_message?: string | null
}

export interface ApiUsageLogUpdate {
  id?: string
  job_id?: string
  created_at?: string
  model?: string
  input_tokens?: number
  output_tokens?: number
  cost_usd?: number
  batch_index?: number | null
}

export interface MonthlySpendUpdate {
  month?: string
  total_cost_usd?: number
  monthly_cap_usd?: number
}

export interface LeadRowUpdate {
  id?: string
  job_id?: string
  row_index?: number
  raw_data?: Record<string, string>
  cleaned_data?: Record<string, string> | null
  status?: 'pending' | 'cleaning' | 'done' | 'error'
  error_msg?: string | null
  created_at?: string
}

export interface Database {
  public: {
    Tables: {
      cleaning_jobs: {
        Row: CleaningJob
        Insert: CleaningJobInsert
        Update: CleaningJobUpdate
        Relationships: []
      }
      api_usage_log: {
        Row: ApiUsageLog
        Insert: ApiUsageLogInsert
        Update: ApiUsageLogUpdate
        Relationships: []
      }
      monthly_spend: {
        Row: MonthlySpend
        Insert: MonthlySpendInsert
        Update: MonthlySpendUpdate
        Relationships: []
      }
      lead_rows: {
        Row: LeadRow
        Insert: LeadRowInsert
        Update: LeadRowUpdate
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
