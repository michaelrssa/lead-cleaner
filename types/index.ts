/** Supabase Database types for the lead cleaner application */

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

export interface Database {
  public: {
    Tables: {
      cleaning_jobs: {
        Row: CleaningJob
        Insert: CleaningJobInsert
        Update: Partial<CleaningJob>
      }
      api_usage_log: {
        Row: ApiUsageLog
        Insert: ApiUsageLogInsert
        Update: Partial<ApiUsageLog>
      }
      monthly_spend: {
        Row: MonthlySpend
        Insert: MonthlySpendInsert
        Update: Partial<MonthlySpend>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
