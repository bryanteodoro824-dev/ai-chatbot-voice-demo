import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET() {
  // 1. Try to fetch shared agent ID from Supabase settings table
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/settings?key=eq.elevenlabs_agent_id&select=value&limit=1`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      )
      if (res.ok) {
        const rows = await res.json()
        if (rows.length > 0 && rows[0].value) {
          return NextResponse.json({ agentId: rows[0].value })
        }
      }
    } catch {
      // fall through to env var fallback
    }
  }

  // 2. Fall back to env var (set ELEVENLABS_AGENT_ID in Vercel)
  const agentId = process.env.ELEVENLABS_AGENT_ID || ''
  return NextResponse.json({ agentId })
}
