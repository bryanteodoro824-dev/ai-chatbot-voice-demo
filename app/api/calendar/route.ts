import { NextRequest, NextResponse } from 'next/server'

const N8N_URL = process.env.N8N_WEBHOOK_CALENDAR

export async function GET(request: NextRequest) {
  if (!N8N_URL) {
    // Return empty slots — frontend will use placeholder calendar
    return NextResponse.json({ slots: [] }, { status: 200 })
  }
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') ?? ''
  const res = await fetch(`${N8N_URL}?id=${encodeURIComponent(id)}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
