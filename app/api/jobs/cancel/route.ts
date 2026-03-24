import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()
    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    const { error } = await supabase
      .from('cleaning_jobs')
      .update({ status: 'cancelled' })
      .eq('id', jobId)

    if (error) {
      return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
