/** Core types for the lead cleaner application */

export interface Lead {
  id: string
  raw: Record<string, string>
  cleaned?: Record<string, string>
  status: 'pending' | 'processing' | 'done' | 'error'
}

export interface Job {
  id: string
  userId: string
  fileName: string
  totalLeads: number
  processedLeads: number
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}
