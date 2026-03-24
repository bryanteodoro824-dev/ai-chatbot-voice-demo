import { NextRequest, NextResponse } from 'next/server'

const N8N_URL = process.env.N8N_WEBHOOK_ONBOARD

export async function POST(request: NextRequest) {
  if (!N8N_URL) {
    return NextResponse.json({ error: 'Onboard webhook not configured' }, { status: 500 })
  }
  const body = await request.json()
  const res = await fetch(N8N_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
