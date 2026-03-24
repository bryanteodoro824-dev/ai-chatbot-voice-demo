import { NextRequest, NextResponse } from 'next/server'

const N8N_URL = process.env.N8N_WEBHOOK_DEMO

export async function GET(request: NextRequest) {
  if (!N8N_URL) {
    return NextResponse.json({ error: 'Demo webhook not configured' }, { status: 500 })
  }
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') ?? ''
  const res = await fetch(`${N8N_URL}?id=${encodeURIComponent(id)}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
